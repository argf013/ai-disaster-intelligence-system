from app.schemas.auth import UserRegister, UserLogin, Token, UserResponse
from app.schemas.weather import WeatherData, LocationPreset
from app.schemas.risk import RiskRequest, RiskResponse
from app.schemas.vision import ImageClassifyResponse, DamageAssessResponse, CandidateScore
from app.schemas.social import SocialDispatchResponse, CustomClassifyRequest
from app.schemas.shelter import ShelterBase, ShelterCreate, ShelterResponse, NearestShelterResult
from app.schemas.assessment import AssessmentCreate, AssessmentResponse
from app.schemas.report import ReportGenerateRequest, ReportResponse

__all__ = [
    "UserRegister", "UserLogin", "Token", "UserResponse",
    "WeatherData", "LocationPreset",
    "RiskRequest", "RiskResponse",
    "ImageClassifyResponse", "DamageAssessResponse", "CandidateScore",
    "SocialDispatchResponse", "CustomClassifyRequest",
    "ShelterBase", "ShelterCreate", "ShelterResponse", "NearestShelterResult",
    "AssessmentCreate", "AssessmentResponse",
    "ReportGenerateRequest", "ReportResponse"
]
