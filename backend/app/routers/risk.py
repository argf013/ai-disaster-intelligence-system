from fastapi import APIRouter
from app.schemas.risk import RiskRequest, RiskResponse
from app.services.risk_service import calculate_disaster_risk

router = APIRouter(prefix="/risk", tags=["Disaster Risk Evaluation"])

@router.post("/evaluate", response_model=RiskResponse)
def evaluate_risk(data: RiskRequest):
    return calculate_disaster_risk(
        rainfall=data.rainfall,
        temperature=data.temperature,
        humidity=data.humidity,
        wind_speed=data.wind_speed
    )
