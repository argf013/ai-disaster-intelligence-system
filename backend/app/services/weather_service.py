import requests
from typing import Dict, Any, List

LOCATION_PRESETS = [
    {
        "name": "Hyderabad (Flood Zone)",
        "latitude": 17.3850,
        "longitude": 78.4867,
        "description": "Telangana low-lying urban catchment area with Musi river flood history"
    },
    {
        "name": "Jakarta (Coastal Submersion Zone)",
        "latitude": -6.2088,
        "longitude": 106.8456,
        "description": "Ciliwung river basin prone to high precipitation urban flooding"
    },
    {
        "name": "Mumbai (Monsoon Coastal Zone)",
        "latitude": 19.0760,
        "longitude": 72.8777,
        "description": "Arabian sea coastal metropolis vulnerable to monsoon tidal surges"
    },
    {
        "name": "Miami (Hurricane Storm Surge Zone)",
        "latitude": 25.7617,
        "longitude": -80.1918,
        "description": "Atlantic tropical cyclone corridor with severe storm surge exposure"
    },
    {
        "name": "Manila (Typhoon Alley)",
        "latitude": 14.5995,
        "longitude": 120.9842,
        "description": "Western Pacific typhoon impact zone prone to flash floods"
    }
]

def fetch_live_weather(lat: float, lon: float) -> Dict[str, float]:
    """
    Fetches real-time weather parameters using the Open-Meteo API.
    Reuses the proven logic from Section 1 (Cell 4) of the notebook.
    """
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m"
    }
    
    try:
        response = requests.get(url, params=params, timeout=15)
        response.raise_for_status()
        current = response.json().get("current", {})
        return {
            "temperature": float(current.get("temperature_2m", 25.0)),
            "humidity": float(current.get("relative_humidity_2m", 60.0)),
            "rainfall": float(current.get("precipitation", 0.0)),
            "wind_speed": float(current.get("wind_speed_10m", 10.0))
        }
    except Exception as e:
        # Graceful fallback for offline / mock testing
        return {
            "temperature": 28.5,
            "humidity": 82.0,
            "rainfall": 45.0,
            "wind_speed": 35.0
        }
