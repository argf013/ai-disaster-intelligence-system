from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.shelter import ShelterResponse, NearestShelterResult
from app.services.gis_service import list_regional_shelters, find_nearest_shelter

router = APIRouter(prefix="/gis", tags=["GIS & Evacuation Shelters"])

@router.get("/shelters", response_model=List[ShelterResponse])
def get_shelters(
    region: Optional[str] = Query(None, description="Optional regional filter"),
    db: Session = Depends(get_db)
):
    return list_regional_shelters(db, region)

@router.get("/nearest", response_model=NearestShelterResult)
def get_nearest_shelter(
    lat: float = Query(..., description="Target latitude"),
    lon: float = Query(..., description="Target longitude"),
    region: Optional[str] = Query(None, description="Optional regional filter"),
    db: Session = Depends(get_db)
):
    result = find_nearest_shelter(lat, lon, db, region)
    if not result:
        raise HTTPException(status_code=404, detail="No matching shelters found in registry.")
    return result
