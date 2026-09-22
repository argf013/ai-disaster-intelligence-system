from typing import Dict, Any, List, Tuple
from app.config import FAST_DEV_MODE

EMERGENCY_LABELS = [
    "medical emergency",
    "people trapped",
    "road blockage",
    "flood report",
    "weather warning",
    "other information"
]

_bart_classifier = None

def get_bart_classifier():
    global _bart_classifier
    if FAST_DEV_MODE:
        return "FALLBACK"
    if _bart_classifier is None:
        try:
            import torch
            from transformers import pipeline
            device = 0 if torch.cuda.is_available() else -1
            _bart_classifier = pipeline(
                "zero-shot-classification",
                model="facebook/bart-large-mnli",
                device=device
            )
        except Exception as e:
            print(f"[NlpService] Notice: BART classifier pipeline initialization deferred/fallback: {e}")
            _bart_classifier = "FALLBACK"
    return _bart_classifier

def determine_urgency(text: str, top_label: str, confidence: float) -> str:
    """
    Contextual urgency decision logic combining BART zero-shot classification,
    confidence metrics, and life-safety indicator signals.

    Rules:
    - LOW: Informational / non-emergency dispatches (community kitchens, aid supplies, clear weather).
    - MEDIUM: Localized disruption, road blockage, flooding warning, weather alerts without immediate threat to life.
    - HIGH: People trapped, injuries, active rescue/evacuation requirements, or localized immediate danger.
    - CRITICAL: Severe immediate life-threatening emergency with multiple victims, structural collapse, or urgent mass rescue.
    """
    lower = text.lower()

    # Acute life-threat indicators (multiple victims, acute immediate rescue needs, life-threatening peril)
    critical_indicators = [
        "multiple", "many people", "several injured", "urgent rescue", "immediate rescue",
        "immediately", "life-threatening", "critical", "drowning", "suffocating",
        "collapsed with people", "trapped on roof", "stranded on roof", "dying",
        "trapped inside building", "mass casualty"
    ]

    # Active rescue and human peril indicators
    active_peril_indicators = [
        "rescue", "trapped", "stuck", "marooned", "injured", "bleeding",
        "casualty", "evacuate", "evacuation needed", "ambulance required",
        "life danger", "stranded inside", "crying for help"
    ]

    # Rule 1: Informational / Non-Emergency
    if top_label == "other information":
        if any(w in lower for w in active_peril_indicators):
            return "MEDIUM"
        return "LOW"

    # Rule 2: Life-Safety Acute Categories (people trapped, medical emergency)
    if top_label in ["people trapped", "medical emergency"]:
        # Elevate to CRITICAL if multiple victims or urgent immediate rescue language is present
        if any(w in lower for w in critical_indicators) or (confidence >= 0.94 and "urgent" in lower):
            return "CRITICAL"
        return "HIGH"

    # Rule 3: Environmental Disruption & Infrastructure (road blockage, flood report, weather warning)
    if top_label in ["road blockage", "flood report", "weather warning"]:
        # If the disruption specifically involves multiple trapped victims or critical peril:
        if any(w in lower for w in critical_indicators):
            return "CRITICAL"
        # If active rescue or stranded persons are explicitly mentioned:
        if any(w in lower for w in active_peril_indicators):
            return "HIGH"
        # Localized disruption, road flooding, or avoidance advisories without human peril:
        return "MEDIUM"

    return "MEDIUM"

def classify_emergency_text(text: str) -> Dict[str, Any]:
    """
    Classifies emergency dispatches using BART Zero-Shot classification from Section 5 & 7 of the notebook,
    and calculates contextual urgency.
    """
    classifier = get_bart_classifier()

    if classifier and classifier != "FALLBACK":
        try:
            res = classifier(text, candidate_labels=EMERGENCY_LABELS)
            top_label = res["labels"][0]
            confidence = round(float(res["scores"][0]), 3)
        except Exception as e:
            print(f"[NlpService] Pipeline inference error: {e}. Using keyword triage.")
            top_label, confidence = _keyword_fallback(text)
    else:
        top_label, confidence = _keyword_fallback(text)

    urgency = determine_urgency(text, top_label, confidence)

    return {
        "text": text,
        "classification": top_label,
        "confidence": confidence,
        "urgency_level": urgency
    }

def _keyword_fallback(text: str) -> Tuple[str, float]:
    lower = text.lower()
    if any(k in lower for k in ["trapped", "stuck", "roof", "marooned"]):
        return "people trapped", 0.93
    elif any(k in lower for k in ["injured", "medical", "doctor", "bleeding", "ambulance", "hospital"]):
        return "medical emergency", 0.91
    elif any(k in lower for k in ["blocked", "road", "debris", "bridge broken", "impassable", "traffic", "avoid"]):
        return "road blockage", 0.89
    elif any(k in lower for k in ["flood", "water rising", "submerged", "overflow", "flooding"]):
        return "flood report", 0.92
    elif any(k in lower for k in ["rain", "storm", "wind", "cyclone", "warning", "forecast"]):
        return "weather warning", 0.95
    else:
        return "other information", 0.85
