from fastapi import APIRouter, File, UploadFile, Depends
from typing import List, Optional
from app.services import extractor_engine
from pydantic import BaseModel
import shutil
import os
import uuid

router = APIRouter(prefix="/extractor", tags=["Data Extraction"])

class UrlInput(BaseModel):
    url: str
    target_house: Optional[str] = None
    target_state: Optional[str] = None

@router.post("/process-url")
def process_url(input_data: UrlInput):
    """
    Extracts structured data (Members, etc.) from a given URL.
    Returns JSON datasets suitable for the frontend.
    """
    try:
        data = extractor_engine.extract_from_url(input_data.url)
        return data
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.post("/process-pdf")
def process_pdf(file: UploadFile = File(...)):
    """
    Extracts structured data from an uploaded PDF file.
    """
    try:
        # Save temp file
        temp_filename = f"temp_upload_{uuid.uuid4()}.pdf"
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Process
        with open(temp_filename, "rb") as f:
            pdf_bytes = f.read()
            data = extractor_engine.extract_from_pdf(pdf_bytes)
            
        # Clean up
        os.remove(temp_filename)
        
        return data  # Contains 'datasets' -> list of {id, title, data, columns}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.post("/ai-extract")
def ai_extract(content: str):
    """
    Fallback: Use Gemini AI to parse raw text content if table parsing failed.
    """
    return extractor_engine.ai_process_content(content)
