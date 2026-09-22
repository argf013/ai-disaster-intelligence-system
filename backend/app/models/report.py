from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from datetime import datetime
from app.database import Base

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=False)
    title = Column(String, nullable=False)
    executive_summary = Column(Text, nullable=False)
    action_directives = Column(Text, nullable=False)  # JSON string or bullet list
    evacuation_advisory = Column(Text, nullable=False)
    markdown_content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
