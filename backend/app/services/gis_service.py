from typing import List, Dict, Any, Optional
from geopy.distance import geodesic
from sqlalchemy.orm import Session
from app.models.shelter import Shelter
from app.schemas.shelter import NearestShelterResult, ShelterResponse

def find_nearest_shelter(
    latitude: float,
    longitude: float,
    db: Session,
    region: Optional[str] = None
) -> Optional[NearestShelterResult]:
    """
    Computes geodesic distance to registered prototype shelters and returns the nearest available shelter.
    Reuses the distance and recommendation logic from Section 6 (Cell 15) of the notebook.
    """
    query = db.query(Shelter)
    if region:
        query = query.filter(Shelter.region.ilike(f"%{region}%"))
    
    shelters = query.all()
    if not shelters:
        # Fallback to all shelters if regional filter is empty
        shelters = db.query(Shelter).all()
        
    if not shelters:
        return None

    best_shelter = None
    min_distance = float("inf")

    for s in shelters:
        dist = geodesic((latitude, longitude), (s.latitude, s.longitude)).km
        if dist < min_distance:
            min_distance = dist
            best_shelter = s

    if not best_shelter:
        return None

    # Construct evacuation route coordinates from origin to destination
    route_coords = [
        [latitude, longitude],
        [best_shelter.latitude, best_shelter.longitude]
    ]

    available_cap = max(0, best_shelter.capacity - best_shelter.current_occupancy)

    return NearestShelterResult(
        shelter=ShelterResponse.from_orm(best_shelter),
        distance_km=round(min_distance, 2),
        available_capacity=available_cap,
        route_coordinates=route_coords
    )

def list_regional_shelters(db: Session, region: Optional[str] = None) -> List[Shelter]:
    query = db.query(Shelter)
    if region:
        query = query.filter(Shelter.region.ilike(f"%{region}%"))
    return query.all()
