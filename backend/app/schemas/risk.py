from pydantic import BaseModel
from typing import Dict, Optional

class RiskRequest(BaseModel):
    rainfall: float
    temperature: float
    humidity: float
    wind_speed: float

class RiskResponse(BaseModel):
    risk_probability: float  # Raw 0.0 to 1.0 probability from XGBoost predict_proba
    risk_score: float        # Normalized 0-100 percentage (e.g. 78.5)
    risk_level: str          # LOW, MEDIUM, HIGH
    model_name: str = "XGBoost Disaster-Risk Classifier"
    factors: Dict[str, float]
    advisory: str
