from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SocialDispatchResponse(BaseModel):
    id: int
    post_text: str
    author_handle: Optional[str] = None
    classification: Optional[str] = None
    confidence: Optional[float] = None
    urgency_level: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_simulated: bool
    created_at: datetime

    class Config:
        from_attributes = True

class CustomClassifyRequest(BaseModel):
    text: str
