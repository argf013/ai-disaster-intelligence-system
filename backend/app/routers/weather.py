from fastapi import APIRouter, Query
from typing import List
from app.schemas.weather import WeatherData, LocationPreset
from app.services.weather_service import fetch_live_weather, LOCATION_PRESETS

router = APIRouter(prefix="/weather", tags=["Weather & Locations"])

@router.get("/presets", response_model=List[LocationPreset])
def get_presets():
    return LOCATION_PRESETS

@router.get("/live", response_model=WeatherData)
def get_live_weather(
    lat: float = Query(..., description="Latitude coordinate"),
    lon: float = Query(..., description="Longitude coordinate")
):
    return fetch_live_weather(lat, lon)
