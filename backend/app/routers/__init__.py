from app.routers.auth import router as auth_router
from app.routers.weather import router as weather_router
from app.routers.risk import router as risk_router
from app.routers.vision import router as vision_router
from app.routers.social import router as social_router
from app.routers.gis import router as gis_router
from app.routers.assessments import router as assessments_router
from app.routers.reports import router as reports_router
from app.routers.admin import router as admin_router

__all__ = [
    "auth_router",
    "weather_router",
    "risk_router",
    "vision_router",
    "social_router",
    "gis_router",
    "assessments_router",
    "reports_router",
    "admin_router"
]
