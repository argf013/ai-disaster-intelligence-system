from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from datetime import datetime
from app.database import Base

class SocialDispatch(Base):
    __tablename__ = "social_dispatches"

    id = Column(Integer, primary_key=True, index=True)
    post_text = Column(String, nullable=False)
    author_handle = Column(String, nullable=True)
    classification = Column(String, nullable=True)
    confidence = Column(Float, nullable=True)
    urgency_level = Column(String, default="MEDIUM")  # CRITICAL, HIGH, MEDIUM, LOW
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    is_simulated = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
