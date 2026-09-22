import uuid
import shutil
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.config import RAW_UPLOAD_DIR
from app.schemas.vision import ImageClassifyResponse, DamageAssessResponse
from app.services.vision_service import classify_disaster_image, compare_images_and_generate_heatmap

router = APIRouter(prefix="/vision", tags=["Computer Vision & Remote Sensing"])

@router.post("/classify", response_model=ImageClassifyResponse)
async def classify_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")
    
    file_ext = Path(file.filename).suffix or ".jpg"
    temp_filename = f"upload_{uuid.uuid4().hex[:8]}{file_ext}"
    target_path = RAW_UPLOAD_DIR / temp_filename

    with open(target_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        result = classify_disaster_image(str(target_path))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image classification failed: {str(e)}")

@router.post("/damage-assessment", response_model=DamageAssessResponse)
async def assess_damage(
    before_file: UploadFile = File(...),
    after_file: UploadFile = File(...)
):
    for f in [before_file, after_file]:
        if not f.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Both uploaded files must be images.")

    b_ext = Path(before_file.filename).suffix or ".jpg"
    a_ext = Path(after_file.filename).suffix or ".jpg"
    
    b_path = RAW_UPLOAD_DIR / f"before_{uuid.uuid4().hex[:8]}{b_ext}"
    a_path = RAW_UPLOAD_DIR / f"after_{uuid.uuid4().hex[:8]}{a_ext}"

    with open(b_path, "wb") as buf:
        shutil.copyfileobj(before_file.file, buf)
    with open(a_path, "wb") as buf:
        shutil.copyfileobj(after_file.file, buf)

    try:
        result = compare_images_and_generate_heatmap(str(b_path), str(a_path))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Damage assessment failed: {str(e)}")
