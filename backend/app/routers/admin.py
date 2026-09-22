import json
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import DATA_DIR
from app.models.user import User
from app.models.shelter import Shelter
from app.models.social import SocialDispatch
from app.models.assessment import Assessment
from app.schemas.shelter import ShelterCreate, ShelterResponse
from app.services.auth_service import require_admin, get_current_user

router = APIRouter(prefix="/admin", tags=["Administrative Portal"])

@router.get("/stats")
def get_admin_stats(db: Session = Depends(get_db), admin: User = Depends(get_current_user)):
    return {
        "users_count": db.query(User).count(),
        "assessments_count": db.query(Assessment).count(),
        "shelters_count": db.query(Shelter).count(),
        "critical_dispatches_count": db.query(SocialDispatch).filter(
            SocialDispatch.urgency_level == "CRITICAL"
        ).count()
    }

@router.post("/shelters", response_model=ShelterResponse, status_code=status.HTTP_201_CREATED)
def create_shelter(payload: ShelterCreate, db: Session = Depends(get_db), admin: User = Depends(get_current_user)):
    shelter = Shelter(
        name=payload.name,
        region=payload.region,
        latitude=payload.latitude,
        longitude=payload.longitude,
        capacity=payload.capacity,
        current_occupancy=payload.current_occupancy,
        contact_phone=payload.contact_phone
    )
    db.add(shelter)
    db.commit()
    db.refresh(shelter)
    return shelter

@router.delete("/shelters/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shelter(id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_user)):
    shelter = db.query(Shelter).filter(Shelter.id == id).first()
    if not shelter:
        raise HTTPException(status_code=404, detail="Shelter not found.")
    db.delete(shelter)
    db.commit()
    return None

@router.post("/seed-data")
def seed_database(db: Session = Depends(get_db), admin: User = Depends(get_current_user)):
    # Seed Shelters
    shelters_file = DATA_DIR / "seed_shelters.json"
    if shelters_file.exists():
        with open(shelters_file, "r") as f:
            shelters_data = json.load(f)
            for s in shelters_data:
                existing = db.query(Shelter).filter(Shelter.name == s["name"]).first()
                if not existing:
                    db.add(Shelter(**s))

    # Seed Dispatches
    dispatches_file = DATA_DIR / "seed_dispatches.json"
    if dispatches_file.exists():
        with open(dispatches_file, "r") as f:
            dispatches_data = json.load(f)
            for d in dispatches_data:
                existing = db.query(SocialDispatch).filter(SocialDispatch.post_text == d["post_text"]).first()
                if not existing:
                    db.add(SocialDispatch(**d, is_simulated=True))

    db.commit()
    return {"message": "Prototype database seeded successfully."}
