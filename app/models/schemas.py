from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from uuid import UUID, uuid4
from datetime import datetime

class SchemaFieldDefinition(BaseModel):
    description: str = Field(..., description="Description of what this field represents to guide the LLM")
    type: str = Field(default="string", description="Expected data type: string, date, number, etc.")

class ExtractionSchema(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    name: str = Field(..., description="Name of the document type, e.g., 'National ID Card'")
    fields: Dict[str, str] = Field(..., description="Key-value pair where key is field name and value is description")
    created_at: datetime = Field(default_factory=datetime.now)

class ExtractionRequest(BaseModel):
    schema_id: UUID
    # File is uploaded separately via multipart/form-data

class ExtractionResult(BaseModel):
    request_id: UUID = Field(default_factory=uuid4)
    schema_id: UUID
    schema_name: str
    extracted_data: Dict[str, Any]
    raw_text: Optional[str] = None
    processed_at: datetime = Field(default_factory=datetime.now)
