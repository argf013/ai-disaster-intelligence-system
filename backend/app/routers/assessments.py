from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from typing import List
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.assessment import Assessment
from app.models.shelter import Shelter
from app.schemas.assessment import AssessmentCreate, AssessmentResponse
from app.services.email_service import send_emergency_disaster_email

router = APIRouter(prefix="/assessments", tags=["Assessments & History"])

@router.post("/save", response_model=AssessmentResponse, status_code=status.HTTP_201_CREATED)
def save_assessment(
    payload: AssessmentCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    assessment = Assessment(
        location_name=payload.location_name,
        latitude=payload.latitude,
        longitude=payload.longitude,
        weather_temperature=payload.weather_temperature,
        weather_humidity=payload.weather_humidity,
        weather_rainfall=payload.weather_rainfall,
        weather_wind_speed=payload.weather_wind_speed,
        risk_score=payload.risk_score,
        risk_level=payload.risk_level,
        detected_disaster=payload.detected_disaster,
        image_confidence=payload.image_confidence,
        image_severity=payload.image_severity,
        yolo_objects=payload.yolo_objects,
        damage_change_score=payload.damage_change_score,
        heatmap_path=payload.heatmap_path,
        nearest_shelter_id=payload.nearest_shelter_id,
        shelter_distance_km=payload.shelter_distance_km,
        emergency_text=payload.emergency_text,
        emergency_category=payload.emergency_category,
        emergency_urgency=payload.emergency_urgency,
        emergency_confidence=payload.emergency_confidence
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    # Trigger real SMTP email alert asynchronously irrespective of severity level
    shelter = None
    if payload.nearest_shelter_id:
        shelter = db.query(Shelter).filter(Shelter.id == payload.nearest_shelter_id).first()

    background_tasks.add_task(
        send_emergency_disaster_email,
        severity=payload.risk_level or "ALERT",
        location_name=payload.location_name,
        risk_score=payload.risk_score,
        shelter_name=shelter.name if shelter else "Primary Municipal Shelter",
        shelter_address=shelter.address if shelter else None,
        shelter_distance_km=payload.shelter_distance_km,
        shelter_phone=shelter.contact_phone if shelter else None,
        detected_disaster=payload.detected_disaster,
        image_confidence=payload.image_confidence,
        yolo_objects=payload.yolo_objects
    )

    return assessment

@router.get("/history", response_model=List[AssessmentResponse])
def get_assessment_history(db: Session = Depends(get_db)):
    return db.query(Assessment).order_by(Assessment.id.desc()).all()

@router.get("/{id}", response_model=AssessmentResponse)
def get_assessment_by_id(id: int, db: Session = Depends(get_db)):
    assessment = db.query(Assessment).filter(Assessment.id == id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found.")
    return assessment

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_assessment(id: int, db: Session = Depends(get_db)):
    assessment = db.query(Assessment).filter(Assessment.id == id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found.")
    db.delete(assessment)
    db.commit()
    return None
