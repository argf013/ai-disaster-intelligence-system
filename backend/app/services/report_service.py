from datetime import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.assessment import Assessment
from app.models.shelter import Shelter
from app.models.social import SocialDispatch
from app.models.report import Report

def generate_situation_report(assessment: Assessment, db: Session, notes: str = None) -> Report:
    """
    Synthesizes multi-modal data into a formal Crisis Situation Report (SitRep).
    Fulfills the integrated decision-support vision outlined in Section 7 of the notebook.
    """
    # Query shelter
    shelter = None
    if assessment.nearest_shelter_id:
        shelter = db.query(Shelter).filter(Shelter.id == assessment.nearest_shelter_id).first()

    # Query active critical social dispatches
    critical_posts = db.query(SocialDispatch).filter(
        SocialDispatch.urgency_level.in_(["CRITICAL", "HIGH"])
    ).limit(5).all()

    timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    title = f"Crisis Situation Report (SitRep) - {assessment.location_name} [{assessment.risk_level}]"

    # Executive Summary
    summary = (
        f"At {timestamp}, a comprehensive multi-modal disaster intelligence assessment was performed "
        f"for {assessment.location_name} ({assessment.latitude:.4f}, {assessment.longitude:.4f}). "
        f"The XGBoost meteorological risk score is assessed at {assessment.risk_score}/100 with an overall incident threat level of {assessment.risk_level} ALERT. "
        f"Atmospheric indicators register rainfall of {assessment.weather_rainfall or 0.0} mm and wind velocity of {assessment.weather_wind_speed or 0.0} km/h. "
    )
    if assessment.detected_disaster:
        summary += (
            f"Computer vision analysis identified '{assessment.detected_disaster.upper()}' with "
            f"{round((assessment.image_confidence or 0.0)*100, 1)}% confidence, resulting in a '{assessment.damage_level}' classification."
        )

    # Evacuation Advisory
    if shelter:
        shelter_addr = f", Address: {shelter.address}" if shelter.address else ""
        evac = (
            f"Primary recommended refuge: {shelter.name} ({shelter.region}{shelter_addr}), located approximately "
            f"{assessment.shelter_distance_km or 'N/A'} km from target epicenter. "
            f"Current shelter capacity: {shelter.capacity - shelter.current_occupancy} available beds / {shelter.capacity} total. "
            f"Emergency hotline: {shelter.contact_phone or 'Contact local civil defense'}."
        )
    else:
        evac = "Direct citizen evacuations to high-ground municipal structures. Regional shelters must be designated immediately."

    # Action Directives
    directives = [
        f"Direct emergency rescue units to prioritized life-safety dispatches in {assessment.location_name}.",
        f"Mobilize flood barriers and standby power generation units in zones exceeding {assessment.risk_score} risk index.",
        f"Establish tactical command and route verification toward {shelter.name if shelter else 'designated muster points'}.",
        "Issue citizen mobile alerts advising avoidance of subterranean road underpasses and swollen drainage canals."
    ]
    if notes:
        directives.append(f"Incident Commander Operator Note: {notes}")

    # Build Markdown Content
    md = f"""# {title}
**Date Generated:** {timestamp}  
**Assessment ID:** #{assessment.id}  
**Threat Level:** `{assessment.risk_level}` (Meteorological Risk [XGBoost]: {assessment.risk_score}/100)  
**Location Coordinates:** `{assessment.latitude:.4f}, {assessment.longitude:.4f}` ({assessment.location_name})

---

## 1. Executive Summary
{summary}

---

## 2. Meteorological Ingestion (Live Open-Meteo Telemetry)
* **Precipitation:** {assessment.weather_rainfall or 0.0} mm
* **Wind Velocity:** {assessment.weather_wind_speed or 0.0} km/h
* **Ambient Temperature:** {assessment.weather_temperature or 0.0} °C
* **Relative Humidity:** {assessment.weather_humidity or 0.0} %

---

## 3. Remote Sensing & Computer Vision Damage Assessment
* **Detected Hazard Pattern:** {assessment.detected_disaster or 'N/A'} (Confidence: {round((assessment.image_confidence or 0.0)*100, 1)}%)
* **Vision Hazard Severity:** {assessment.image_severity or 'N/A'}
* **YOLO11 Detected Objects:** {assessment.yolo_objects or 'None registered'}
* **Before/After Surface Pixel Change:** {assessment.damage_change_score or 'N/A'}%
* **Damage Category:** {assessment.damage_level or 'N/A'}

---

## 4. Priority Citizen Emergency Dispatches (BART NLP Triage)
"""
    if assessment.emergency_text:
        md += f"* **🚨 [ASSESSED INCIDENT DISPATCH - {assessment.emergency_urgency or 'CRITICAL'}] {assessment.emergency_category.upper() if assessment.emergency_category else 'EMERGENCY'}:** \"{assessment.emergency_text}\" *(BART Confidence: {round((assessment.emergency_confidence or 0.0)*100, 1)}%)*\n"

    if critical_posts:
        for p in critical_posts:
            md += f"* **[{p.urgency_level}] {p.classification.upper()}:** \"{p.post_text}\" *(Confidence: {p.confidence})*\n"
    elif not assessment.emergency_text:
        md += "*No pending critical dispatches in current operational sector.*\n"

    md += f"""
---

## 5. Evacuation Routing & Shelter Logistics
{evac}

---

## 6. Immediate Incident Command Directives
"""
    for idx, d in enumerate(directives, 1):
        md += f"{idx}. {d}\n"

    md += """
---
*Notice: This report is generated by the AI Disaster Intelligence Academic Prototype. Data combines live Open-Meteo telemetry, pre-trained HuggingFace foundation models, and prototype emergency infrastructure layers.*
"""

    report = Report(
        assessment_id=assessment.id,
        title=title,
        executive_summary=summary,
        action_directives="\n".join(directives),
        evacuation_advisory=evac,
        markdown_content=md
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report
