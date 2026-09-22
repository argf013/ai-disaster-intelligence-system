import os
import numpy as np
import pandas as pd
from typing import Dict, Any
from pathlib import Path
from app.config import DATA_DIR

_xgb_risk_model = None
MODEL_CACHE_FILE = DATA_DIR / "xgboost_risk_model.json"

def get_xgboost_risk_model():
    """
    Loads or trains the baseline XGBoost disaster-risk classifier.
    Source of truth: Section 2 (Cell 6) of the latest client notebook.
    """
    global _xgb_risk_model
    if _xgb_risk_model is not None:
        return _xgb_risk_model

    from xgboost import XGBClassifier
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import accuracy_score

    # Check if pre-trained weights exist
    if MODEL_CACHE_FILE.exists():
        try:
            model = XGBClassifier()
            model.load_model(str(MODEL_CACHE_FILE))
            _xgb_risk_model = model
            print("[RiskService] Loaded cached XGBoost model from", MODEL_CACHE_FILE)
            return _xgb_risk_model
        except Exception as e:
            print(f"[RiskService] Failed to load cached model: {e}. Retraining...")

    print("[RiskService] Training baseline XGBoost disaster-risk classifier (Cell 6 logic)...")
    np.random.seed(42)
    N = 6000

    rain = np.random.uniform(0, 200, N)
    temp = np.random.uniform(10, 50, N)
    hum = np.random.uniform(20, 100, N)
    wind = np.random.uniform(0, 140, N)

    score = (
        0.45 * np.clip(rain / 200, 0, 1)
        + 0.20 * np.clip(hum / 100, 0, 1)
        + 0.25 * np.clip(wind / 140, 0, 1)
        + 0.10 * np.clip(temp / 50, 0, 1)
    )

    df = pd.DataFrame({
        'rainfall': rain,
        'temperature': temp,
        'humidity': hum,
        'wind_speed': wind,
        'risk': (score > 0.48).astype(int)
    })

    X = df[['rainfall', 'temperature', 'humidity', 'wind_speed']]
    y = df['risk']

    Xt, Xv, yt, yv = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = XGBClassifier(
        n_estimators=200,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.9,
        colsample_bytree=0.9,
        objective='binary:logistic',
        eval_metric='logloss',
        random_state=42,
        n_jobs=-1
    )
    model.fit(Xt, yt)

    val_preds = model.predict(Xv)
    val_acc = accuracy_score(yv, val_preds)
    print(f"[RiskService] XGBoost validation accuracy: {round(val_acc * 100, 2)}%")

    try:
        model.save_model(str(MODEL_CACHE_FILE))
        print(f"[RiskService] Saved trained XGBoost model to {MODEL_CACHE_FILE}")
    except Exception as e:
        print(f"[RiskService] Could not cache model to disk: {e}")

    _xgb_risk_model = model
    return _xgb_risk_model

def calculate_disaster_risk(
    rainfall: float,
    temperature: float,
    humidity: float,
    wind_speed: float
) -> Dict[str, Any]:
    """
    Evaluates meteorological disaster risk using the trained XGBoost classifier.
    Computes risk_probability via predict_proba and assigns LOW/MEDIUM/HIGH severity.
    """
    model = get_xgboost_risk_model()

    input_df = pd.DataFrame([{
        'rainfall': float(rainfall),
        'temperature': float(temperature),
        'humidity': float(humidity),
        'wind_speed': float(wind_speed)
    }])

    # Probability of high risk (class 1) from XGBoost
    probabilities = model.predict_proba(input_df)[0]
    risk_probability = float(probabilities[1])

    # Thresholding rules directly from Section 2 (Cell 6) of notebook:
    # risk_level = 'LOW' if risk_probability < .35 else ('MEDIUM' if risk_probability < .65 else 'HIGH')
    if risk_probability < 0.35:
        risk_level = "LOW"
        advisory = "Normal meteorological parameters. Low statistical risk of acute inundation or macro-hazard."
    elif risk_probability < 0.65:
        risk_level = "MEDIUM"
        advisory = "Elevated meteorological indicators. Low-lying catchment sectors on advisory standby."
    else:
        risk_level = "HIGH"
        advisory = "Critical meteorological thresholds exceeded. High probability of acute flooding and structural hazard."

    # Factor normalization for UI breakdown
    norm_rain = min(max(rainfall / 200.0, 0.0), 1.0)
    norm_hum = min(max(humidity / 100.0, 0.0), 1.0)
    norm_wind = min(max(wind_speed / 140.0, 0.0), 1.0)
    norm_temp = min(max(temperature / 50.0, 0.0), 1.0)

    return {
        "risk_probability": round(risk_probability, 4),
        "risk_score": round(risk_probability * 100.0, 1),
        "risk_level": risk_level,
        "model_name": "XGBoost Disaster-Risk Classifier",
        "factors": {
            "rainfall_impact": round(norm_rain * 0.45 * 100, 1),
            "humidity_impact": round(norm_hum * 0.20 * 100, 1),
            "wind_impact": round(norm_wind * 0.25 * 100, 1),
            "temperature_impact": round(norm_temp * 0.10 * 100, 1),
        },
        "advisory": advisory
    }
