import uuid
import shutil
import json
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks, Depends
from sqlalchemy.orm import Session
from app.config import RAW_UPLOAD_DIR
from app.database import get_db
from app.schemas.vision import ImageClassifyResponse, DamageAssessResponse
from app.services.vision_service import classify_disaster_image, compare_images_and_generate_heatmap
from app.services.email_service import send_emergency_disaster_email
from app.services.gis_service import find_nearest_shelter

router = APIRouter(prefix="/vision", tags=["Computer Vision & Remote Sensing"])

@router.post("/classify", response_model=ImageClassifyResponse)
async def classify_image(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    location_name: Optional[str] = Form(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    db: Session = Depends(get_db)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")
    
    file_ext = Path(file.filename).suffix or ".jpg"
    temp_filename = f"upload_{uuid.uuid4().hex[:8]}{file_ext}"
    target_path = RAW_UPLOAD_DIR / temp_filename

    with open(target_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        result = classify_disaster_image(str(target_path))
        
        # Dispatch emergency disaster notification alert irrespective of model severity
        lat = latitude if latitude is not None else 17.3850
        lon = longitude if longitude is not None else 78.4867
        shelter_res = find_nearest_shelter(lat, lon, db)
        
        yolo_str = (
            ", ".join([f"{o.name} ({round(o.confidence * 100)}%)" for o in result.yolo_objects])
            if result.yolo_objects
            else None
        )
        
        background_tasks.add_task(
            send_emergency_disaster_email,
            severity=result.severity if result.severity in ["HIGH", "CRITICAL"] else "HIGH",
            location_name=location_name or "Active Incident Sector",
            risk_score=round(result.top_confidence * 100, 1),
            shelter_name=shelter_res.shelter.name if shelter_res else "Primary Municipal Shelter",
            shelter_address=shelter_res.shelter.address if shelter_res else None,
            shelter_distance_km=shelter_res.distance_km if shelter_res else None,
            shelter_phone=shelter_res.shelter.contact_phone if shelter_res else None,
            detected_disaster=result.top_disaster,
            image_confidence=result.top_confidence,
            yolo_objects=yolo_str
        )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image classification failed: {str(e)}")

@router.post("/damage-assessment", response_model=DamageAssessResponse)
async def assess_damage(
    before_file: UploadFile = File(...),
    after_file: UploadFile = File(...)
):
    for f in [before_file, after_file]:
        if not f.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Both uploaded files must be images.")

    b_ext = Path(before_file.filename).suffix or ".jpg"
    a_ext = Path(after_file.filename).suffix or ".jpg"
    
    b_path = RAW_UPLOAD_DIR / f"before_{uuid.uuid4().hex[:8]}{b_ext}"
    a_path = RAW_UPLOAD_DIR / f"after_{uuid.uuid4().hex[:8]}{a_ext}"

    with open(b_path, "wb") as buf:
        shutil.copyfileobj(before_file.file, buf)
    with open(a_path, "wb") as buf:
        shutil.copyfileobj(after_file.file, buf)

    try:
        result = compare_images_and_generate_heatmap(str(b_path), str(a_path))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Damage assessment failed: {str(e)}")
