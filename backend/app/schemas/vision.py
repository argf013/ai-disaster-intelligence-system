from pydantic import BaseModel
from typing import List, Optional

class CandidateScore(BaseModel):
    label: str
    score: float

class YoloDetectedObject(BaseModel):
    name: str
    confidence: float
    box: Optional[List[float]] = None

class ImageClassifyResponse(BaseModel):
    top_disaster: str
    top_confidence: float
    severity: str
    all_scores: List[CandidateScore]
    yolo_objects: List[YoloDetectedObject] = []
    yolo_object_count: int = 0
    annotated_image_url: Optional[str] = None
    execution_mode: Optional[str] = "inference"  # "inference" (real models) or "fallback_dev_mode"

class DamageAssessResponse(BaseModel):
    change_score: float
    damage_level: str
    heatmap_url: str
