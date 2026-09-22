from pydantic import BaseModel
from typing import Optional

class WeatherData(BaseModel):
    temperature: float
    humidity: float
    rainfall: float
    wind_speed: float

class LocationPreset(BaseModel):
    name: str
    latitude: float
    longitude: float
    description: Optional[str] = None
