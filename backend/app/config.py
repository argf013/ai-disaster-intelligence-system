import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.getenv("SECRET_KEY", "academic-disaster-intel-secret-key-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours
FAST_DEV_MODE = os.getenv("FAST_DEV_MODE", "0") == "1"

# SMTP Alert Notification Settings (Gmail SMTP / Standard SMTP)
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", "") or SMTP_USER
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "AI Disaster Intelligence System")
DEFAULT_ALERT_RECIPIENT = os.getenv("ALERT_RECIPIENT_EMAIL", "")

DATABASE_URL = f"sqlite:///{BASE_DIR}/disaster_intel.db"

UPLOAD_DIR = BASE_DIR / "uploads"
RAW_UPLOAD_DIR = UPLOAD_DIR / "raw"
HEATMAP_UPLOAD_DIR = UPLOAD_DIR / "heatmaps"
ANNOTATED_UPLOAD_DIR = UPLOAD_DIR / "annotated"
DATA_DIR = BASE_DIR / "data"

for directory in [UPLOAD_DIR, RAW_UPLOAD_DIR, HEATMAP_UPLOAD_DIR, ANNOTATED_UPLOAD_DIR, DATA_DIR]:
    directory.mkdir(parents=True, exist_ok=True)
