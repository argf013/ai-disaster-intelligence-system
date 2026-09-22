from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ShelterBase(BaseModel):
    name: str
    region: str
    address: Optional[str] = None
    latitude: float
    longitude: float
    capacity: int
    current_occupancy: int = 0
    contact_phone: Optional[str] = None

class ShelterCreate(ShelterBase):
    pass

class ShelterResponse(ShelterBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class NearestShelterResult(BaseModel):
    shelter: ShelterResponse
    distance_km: float
    available_capacity: int
    route_coordinates: List[List[float]]  # [[lat, lon], [lat, lon]]
