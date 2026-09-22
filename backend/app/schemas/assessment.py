from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AssessmentCreate(BaseModel):
    location_name: str
    latitude: float
    longitude: float
    weather_temperature: Optional[float] = None
    weather_humidity: Optional[float] = None
    weather_rainfall: Optional[float] = None
    weather_wind_speed: Optional[float] = None
    risk_score: float
    risk_level: str
    detected_disaster: Optional[str] = None
    image_confidence: Optional[float] = None
    image_severity: Optional[str] = None
    yolo_objects: Optional[str] = None
    damage_change_score: Optional[float] = None
    damage_level: Optional[str] = None
    heatmap_path: Optional[str] = None
    nearest_shelter_id: Optional[int] = None
    shelter_distance_km: Optional[float] = None
    emergency_text: Optional[str] = None
    emergency_category: Optional[str] = None
    emergency_urgency: Optional[str] = None
    emergency_confidence: Optional[float] = None

class AssessmentResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    location_name: str
    latitude: float
    longitude: float
    weather_temperature: Optional[float] = None
    weather_humidity: Optional[float] = None
    weather_rainfall: Optional[float] = None
    weather_wind_speed: Optional[float] = None
    risk_score: float
    risk_level: str
    detected_disaster: Optional[str] = None
    image_confidence: Optional[float] = None
    image_severity: Optional[str] = None
    yolo_objects: Optional[str] = None
    damage_change_score: Optional[float] = None
    damage_level: Optional[str] = None
    heatmap_path: Optional[str] = None
    nearest_shelter_id: Optional[int] = None
    shelter_distance_km: Optional[float] = None
    emergency_text: Optional[str] = None
    emergency_category: Optional[str] = None
    emergency_urgency: Optional[str] = None
    emergency_confidence: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True
