from fastapi import APIRouter, UploadFile, File, HTTPException, Body, Depends
from typing import Dict, List
from sqlalchemy.orm import Session
from uuid import UUID, uuid4
import shutil
import os
import logging
from app.models.schemas import ExtractionSchema, ExtractionResult
from app.models.db_models import SchemaModel, ExtractionResultModel
from app.db.database import get_db
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/schemas", response_model=ExtractionSchema)
def create_schema(name: str = Body(...), fields: Dict[str, str] = Body(...), db: Session = Depends(get_db)):
    """
    Define a new document schema for extraction and save to DB.
    """
    # Check if exists
    existing = db.query(SchemaModel).filter(SchemaModel.name == name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Schema with this name already exists")
    
    db_schema = SchemaModel(name=name, fields=fields)
    db.add(db_schema)
    db.commit()
    db.refresh(db_schema)
    
    return ExtractionSchema(
        id=UUID(db_schema.id),
        name=db_schema.name,
        fields=db_schema.fields,
        created_at=db_schema.created_at
    )

@router.get("/schemas", response_model=List[ExtractionSchema])
def list_schemas(db: Session = Depends(get_db)):
    schemas = db.query(SchemaModel).all()
    return [
        ExtractionSchema(
            id=UUID(s.id),
            name=s.name,
            fields=s.fields,
            created_at=s.created_at
        ) for s in schemas
    ]

@router.post("/extract/{schema_id}", response_model=ExtractionResult)
async def process_document(schema_id: UUID, file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Upload a PDF and extract data based on the specified schema using Real AI.
    """
    schema_def = db.query(SchemaModel).filter(SchemaModel.id == str(schema_id)).first()
    if not schema_def:
        raise HTTPException(status_code=404, detail="Schema not found")
    
    # Save uploaded file
    upload_dir = os.path.join(settings.STORAGE_DIR, "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, f"{uuid4()}_{file.filename}")
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    logger.info(f"File saved to {file_path}")
    
    try:
        from app.services.ocr import OCRService
        from app.services.extraction import ExtractionService
        
        # 1. Real OCR
        ocr = OCRService() 
        raw_text = ocr.process_pdf(file_path)
        
        # 2. Real Extraction
        extractor = ExtractionService(model_name=settings.OLLAMA_MODEL)
        data = extractor.extract_data(raw_text, schema_def.fields)
        
        # 3. Save Real Result
        db_result = ExtractionResultModel(
            schema_id=str(schema_id),
            schema_name=schema_def.name,
            extracted_data=data,
            raw_text=raw_text,
            source_file_path=file_path
        )
        db.add(db_result)
        db.commit()
        db.refresh(db_result)
        
        return ExtractionResult(
            request_id=UUID(db_result.id),
            schema_id=UUID(db_result.schema_id),
            schema_name=db_result.schema_name,
            extracted_data=db_result.extracted_data,
            raw_text=raw_text[:2000] + "..." if len(raw_text) > 2000 else raw_text, # Preview
            processed_at=db_result.processed_at
        )
        
    except ImportError:
         raise HTTPException(status_code=500, detail="Services not initialized. Dependencies missing?")
    except Exception as e:
        logger.error(f"Processing failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
