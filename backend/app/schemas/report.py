from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ReportGenerateRequest(BaseModel):
    assessment_id: int
    additional_notes: Optional[str] = None

class ReportResponse(BaseModel):
    id: int
    assessment_id: int
    title: str
    executive_summary: str
    action_directives: str
    evacuation_advisory: str
    markdown_content: str
    created_at: datetime

    class Config:
        from_attributes = True
