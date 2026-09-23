import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr
from typing import Dict, Any, Optional
from app.config import (
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASSWORD,
    SMTP_FROM_EMAIL,
    SMTP_FROM_NAME,
    DEFAULT_ALERT_RECIPIENT
)

def send_emergency_disaster_email(
    severity: str,
    location_name: str,
    risk_score: float,
    shelter_name: Optional[str] = None,
    shelter_address: Optional[str] = None,
    shelter_distance_km: Optional[float] = None,
    shelter_phone: Optional[str] = None,
    detected_disaster: Optional[str] = None,
    image_confidence: Optional[float] = None,
    yolo_objects: Optional[str] = None,
    recipient_email: Optional[str] = None
) -> Dict[str, Any]:
    """
    Sends an immediate HTML emergency broadcast email when an incident is evaluated at HIGH or CRITICAL severity.
    Includes:
    - Disaster severity and location
    - Quantitative risk score
    - Multi-modal vision findings (CLIP & YOLO11)
    - Nearest designated shelter name, exact address, and distance
    """
    target_email = recipient_email or DEFAULT_ALERT_RECIPIENT or SMTP_USER
    if not SMTP_USER or not SMTP_PASSWORD or not target_email:
        print("[EmailService] SMTP credentials not configured. Skipping real SMTP dispatch.")
        return {
            "sent": False,
            "reason": "SMTP_USER, SMTP_PASSWORD, or recipient not configured in environment."
        }

    subject = f"🚨 URGENT {severity} ALERT: Multi-Modal Disaster Declared for {location_name}"

    # Build HTML Message Body
    html_body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #f3f4f6; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background-color: #111827; border: 1px solid #dc2626; border-radius: 12px; padding: 24px;">
          <h2 style="color: #ef4444; margin-top: 0; display: flex; align-items: center;">
            ⚠️ CRISIS EMERGENCY BROADCAST: {severity} ALERT
          </h2>
          <p style="font-size: 14px; color: #9ca3af; line-height: 1.5;">
            An urgent disaster alert has been triggered by the <b>AI Disaster Intelligence System</b>.
            Immediate life-safety and evacuation directives are in effect for the designated sector.
          </p>

          <table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px;">
            <tr style="border-bottom: 1px solid #1f2937;">
              <td style="padding: 8px 0; color: #9ca3af;">Target Epicenter:</td>
              <td style="padding: 8px 0; color: #ffffff; font-weight: bold;">{location_name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #1f2937;">
              <td style="padding: 8px 0; color: #9ca3af;">Disaster Severity Level:</td>
              <td style="padding: 8px 0; color: #f87171; font-weight: bold;">{severity} ALERT</td>
            </tr>
            <tr style="border-bottom: 1px solid #1f2937;">
              <td style="padding: 8px 0; color: #9ca3af;">Meteorological Risk (XGBoost):</td>
              <td style="padding: 8px 0; color: #ffffff;"><b>{risk_score}</b> / 100</td>
            </tr>
    """

    if detected_disaster:
        conf_str = f" ({round(image_confidence * 100, 1)}% confidence)" if image_confidence else ""
        html_body += f"""
            <tr style="border-bottom: 1px solid #1f2937;">
              <td style="padding: 8px 0; color: #9ca3af;">Vision Hazard (CLIP):</td>
              <td style="padding: 8px 0; color: #34d399; font-weight: bold; text-transform: uppercase;">{detected_disaster}{conf_str}</td>
            </tr>
        """

    if yolo_objects:
        html_body += f"""
            <tr style="border-bottom: 1px solid #1f2937;">
              <td style="padding: 8px 0; color: #9ca3af;">Objects Detected (YOLO11):</td>
              <td style="padding: 8px 0; color: #38bdf8;">{yolo_objects}</td>
            </tr>
        """

    html_body += """
          </table>

          <div style="margin-top: 20px; background-color: #1e293b; border-left: 4px solid #10b981; padding: 14px; border-radius: 6px;">
            <h4 style="color: #34d399; margin: 0 0 8px 0;">🛡️ PRIMARY DESIGNATED EVACUATION REFUGE</h4>
    """

    if shelter_name:
        dist_str = f"{shelter_distance_km} km away" if shelter_distance_km else "In sector"
        addr_str = shelter_address if shelter_address else "Address registered with Civil Defense"
        phone_str = f"Hotline: {shelter_phone}" if shelter_phone else ""

        html_body += f"""
            <p style="margin: 4px 0; color: #ffffff; font-weight: bold; font-size: 14px;">{shelter_name}</p>
            <p style="margin: 4px 0; color: #94a3b8; font-size: 13px;">📍 <b>Address:</b> {addr_str}</p>
            <p style="margin: 4px 0; color: #34d399; font-size: 13px;">📏 <b>Distance:</b> {dist_str}</p>
            <p style="margin: 4px 0; color: #60a5fa; font-size: 12px;">📞 {phone_str}</p>
        """
    else:
        html_body += """
            <p style="margin: 4px 0; color: #e2e8f0; font-size: 13px;">
              Seek municipal reinforced structures on high ground immediately.
            </p>
        """

    html_body += """
          </div>

          <p style="font-size: 11px; color: #64748b; margin-top: 24px; border-top: 1px solid #1f2937; padding-top: 12px; text-align: center;">
            This is an automated emergency broadcast generated by the AI Disaster Intelligence Prototype.
          </p>
        </div>
      </body>
    </html>
    """

    sender_address = SMTP_FROM_EMAIL or SMTP_USER

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = formataddr((SMTP_FROM_NAME, sender_address))
    message["To"] = target_email
    message.attach(MIMEText(html_body, "html"))

    try:
        context = ssl.create_default_context()
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.starttls(context=context)
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(sender_address, [target_email], message.as_string())
        print(f"[EmailService] Emergency email alert successfully dispatched to {target_email} from '{SMTP_FROM_NAME}' <{sender_address}>")
        return {"sent": True, "recipient": target_email}
    except Exception as e:
        print(f"[EmailService] Failed to send email alert via SMTP: {e}")
        return {"sent": False, "error": str(e)}
