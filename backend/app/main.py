import json
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import UPLOAD_DIR, DATA_DIR
from app.database import engine, Base, SessionLocal
from app.models.user import User
from app.models.shelter import Shelter
from app.models.social import SocialDispatch
from app.models.assessment import Assessment
from app.models.report import Report
from app.services.auth_service import get_password_hash
from app.routers import (
    auth_router,
    weather_router,
    risk_router,
    vision_router,
    social_router,
    gis_router,
    assessments_router,
    reports_router,
    admin_router
)

# Initialize database schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Disaster Intelligence System API",
    description="Academic Prototype REST API integrating weather, remote sensing, NLP, GIS, and decision support.",
    version="1.0.0"
)

# Configure CORS for decoupled frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits localhost:5173 (Vite), localhost:3000, etc.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory for static heatmap / image serving
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Include all API v1 routers
API_PREFIX = "/api/v1"
app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(weather_router, prefix=API_PREFIX)
app.include_router(risk_router, prefix=API_PREFIX)
app.include_router(vision_router, prefix=API_PREFIX)
app.include_router(social_router, prefix=API_PREFIX)
app.include_router(gis_router, prefix=API_PREFIX)
app.include_router(assessments_router, prefix=API_PREFIX)
app.include_router(reports_router, prefix=API_PREFIX)
app.include_router(admin_router, prefix=API_PREFIX)

@app.on_event("startup")
def startup_seed_data():
    """
    Seeds default administrative user, prototype shelters, and simulated dispatches on initial launch.
    """
    db = SessionLocal()
    try:
        # 1. Default Admin & Operator
        if not db.query(User).filter(User.email == "admin@disaster.intel").first():
            admin_user = User(
                email="admin@disaster.intel",
                hashed_password=get_password_hash("admin123"),
                full_name="Chief Incident Commander",
                role="admin"
            )
            db.add(admin_user)

        if not db.query(User).filter(User.email == "operator@disaster.intel").first():
            op_user = User(
                email="operator@disaster.intel",
                hashed_password=get_password_hash("operator123"),
                full_name="Field Operations Officer",
                role="operator"
            )
            db.add(op_user)

        # 2. Seed Prototype Shelters
        if db.query(Shelter).count() == 0:
            shelters_path = DATA_DIR / "seed_shelters.json"
            if shelters_path.exists():
                with open(shelters_path, "r") as f:
                    for s in json.load(f):
                        db.add(Shelter(**s))

        # 3. Seed Simulated Emergency Dispatches
        if db.query(SocialDispatch).count() == 0:
            dispatches_path = DATA_DIR / "seed_dispatches.json"
            if dispatches_path.exists():
                with open(dispatches_path, "r") as f:
                    for d in json.load(f):
                        db.add(SocialDispatch(**d, is_simulated=True))

        db.commit()
        print("[AI Disaster Intelligence] Initial database seeding completed successfully.")
    except Exception as e:
        db.rollback()
        print(f"[AI Disaster Intelligence] Warning during database seeding: {e}")
    finally:
        db.close()

@app.get("/")
def root():
    return {
        "system": "AI Disaster Intelligence System",
        "status": "online",
        "version": "1.0.0",
        "docs_url": "/docs",
        "mode": "Academic Prototype"
    }

@app.get(f"{API_PREFIX}/health")
def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "prototype_features": [
            "Open-Meteo Weather Ingestion",
            "Meteorological Risk Calculation",
            "CLIP Disaster Vision Classification",
            "OpenCV Before/After Damage Comparison",
            "BART Emergency Dispatch NLP Triage",
            "GIS Geodesic Shelter Recommendation",
            "Multi-modal SitRep Generation"
        ]
    }
