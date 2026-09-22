from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.social import SocialDispatch
from app.schemas.social import SocialDispatchResponse, CustomClassifyRequest
from app.services.nlp_service import classify_emergency_text

router = APIRouter(prefix="/social", tags=["Social Media Emergency Intelligence"])

@router.get("/feed", response_model=List[SocialDispatchResponse])
def get_social_feed(
    urgency: Optional[str] = Query(None, description="Filter by urgency: CRITICAL, HIGH, MEDIUM, LOW"),
    db: Session = Depends(get_db)
):
    query = db.query(SocialDispatch)
    if urgency:
        query = query.filter(SocialDispatch.urgency_level == urgency.upper())
    return query.order_by(SocialDispatch.id.desc()).all()

@router.post("/classify-custom")
def classify_custom_text(payload: CustomClassifyRequest):
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
    return classify_emergency_text(payload.text)

@router.post("/create", response_model=SocialDispatchResponse)
def submit_dispatch(payload: CustomClassifyRequest, db: Session = Depends(get_db)):
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
    
    analysis = classify_emergency_text(payload.text)
    dispatch = SocialDispatch(
        post_text=payload.text,
        author_handle="@operator_entry",
        classification=analysis["classification"],
        confidence=analysis["confidence"],
        urgency_level=analysis["urgency_level"],
        is_simulated=True
    )
    db.add(dispatch)
    db.commit()
    db.refresh(dispatch)
    return dispatch
