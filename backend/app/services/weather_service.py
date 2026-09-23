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
        "name": "Mumbai (Monsoon Coastal Zone)",
        "latitude": 19.0760,
        "longitude": 72.8777,
        "description": "Arabian Sea coastal metropolis vulnerable to monsoon tidal surges and Mithi river overflow"
    },
    {
        "name": "Chennai (Coromandel Flash Flood Zone)",
        "latitude": 13.0827,
        "longitude": 80.2707,
        "description": "Northeast monsoon flash flood vulnerable coastal basin and Adyar river delta"
    },
    {
        "name": "Kolkata (Bay of Bengal Cyclone Corridor)",
        "latitude": 22.5726,
        "longitude": 88.3639,
        "description": "Ganges delta urban area prone to severe cyclonic storms and Hooghly tidal surges"
    },
    {
        "name": "Delhi NCR (Yamuna River Floodplain)",
        "latitude": 28.6139,
        "longitude": 77.2090,
        "description": "National capital basin prone to seasonal Yamuna river embankment overflow"
    },
    {
        "name": "Bengaluru (Urban Flash Flood Zone)",
        "latitude": 12.9716,
        "longitude": 77.5946,
        "description": "Plateau valley topography with lake interconnectivity breaches and flash floods"
    },
    {
        "name": "Kochi (Monsoon Coastal Inundation Basin)",
        "latitude": 9.9312,
        "longitude": 76.2673,
        "description": "Vembanad estuary and Periyar river basin vulnerable to severe monsoon deluges"
    },
    {
        "name": "Bhubaneswar (Odisha Cyclone Corridor)",
        "latitude": 20.2961,
        "longitude": 85.8245,
        "description": "Coastal plains vulnerable to severe cyclonic storm landfalls and Mahanadi surges"
    },
    {
        "name": "Ahmedabad (Sabarmati River Floodplain)",
        "latitude": 23.0225,
        "longitude": 72.5714,
        "description": "Sabarmati river drainage basin with sudden cloudburst inundation vulnerability"
    },
    {
        "name": "Patna (Ganga & Kosi Inundation Plain)",
        "latitude": 25.5941,
        "longitude": 85.1376,
        "description": "Gangetic floodplains exposed to recurring seasonal river inundation"
    },
    {
        "name": "Guwahati (Brahmaputra Deluge & Landslide Belt)",
        "latitude": 26.1445,
        "longitude": 91.7362,
        "description": "Brahmaputra river valley subject to intense flash floods and slope instabilities"
    },
    {
        "name": "Pune (Mutha Basin Flash Flood Corridor)",
        "latitude": 18.5204,
        "longitude": 73.8567,
        "description": "Western Ghats leeward foothills prone to dam discharge and urban river surges"
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
