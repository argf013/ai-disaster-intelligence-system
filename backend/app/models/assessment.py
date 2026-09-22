from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from datetime import datetime
from app.database import Base

class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    location_name = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    # Weather
    weather_temperature = Column(Float, nullable=True)
    weather_humidity = Column(Float, nullable=True)
    weather_rainfall = Column(Float, nullable=True)
    weather_wind_speed = Column(Float, nullable=True)
    
    # Risk
    risk_score = Column(Float, nullable=False)
    risk_level = Column(String, nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    
    # Vision (CLIP + YOLO11)
    detected_disaster = Column(String, nullable=True)
    image_confidence = Column(Float, nullable=True)
    image_severity = Column(String, nullable=True)  # LOW, MEDIUM, HIGH from CLIP
    yolo_objects = Column(String, nullable=True)    # JSON string of detected entities: [{"name": "boat", "confidence": 0.84}]
    damage_change_score = Column(Float, nullable=True)
    damage_level = Column(String, nullable=True)
    heatmap_path = Column(String, nullable=True)
    
    # GIS
    nearest_shelter_id = Column(Integer, ForeignKey("shelters.id"), nullable=True)
    shelter_distance_km = Column(Float, nullable=True)

    # Citizen Emergency NLP Triage (BART)
    emergency_text = Column(String, nullable=True)
    emergency_category = Column(String, nullable=True)
    emergency_urgency = Column(String, nullable=True)
    emergency_confidence = Column(Float, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
