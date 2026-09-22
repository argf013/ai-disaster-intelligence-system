from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.assessment import Assessment
from app.models.report import Report
from app.schemas.report import ReportGenerateRequest, ReportResponse
from app.services.report_service import generate_situation_report

router = APIRouter(prefix="/reports", tags=["Situation Reports & Decision Support"])

@router.post("/generate", response_model=ReportResponse)
def create_report(payload: ReportGenerateRequest, db: Session = Depends(get_db)):
    assessment = db.query(Assessment).filter(Assessment.id == payload.assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found.")
    
    report = generate_situation_report(assessment, db, payload.additional_notes)
    return report

@router.get("/{id}", response_model=ReportResponse)
def get_report(id: int, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")
    return report

@router.get("/{id}/export")
def export_report(
    id: int,
    format: str = Query("markdown", pattern="^(markdown|json)$"),
    db: Session = Depends(get_db)
):
    report = db.query(Report).filter(Report.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")

    if format == "markdown":
        filename = f"SitRep_Assessment_{report.assessment_id}.md"
        return Response(
            content=report.markdown_content,
            media_type="text/markdown",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    else:
        import json
        filename = f"SitRep_Assessment_{report.assessment_id}.json"
        data = {
            "id": report.id,
            "assessment_id": report.assessment_id,
            "title": report.title,
            "executive_summary": report.executive_summary,
            "action_directives": report.action_directives.split("\n"),
            "evacuation_advisory": report.evacuation_advisory,
            "created_at": report.created_at.isoformat()
        }
        return Response(
            content=json.dumps(data, indent=2),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
