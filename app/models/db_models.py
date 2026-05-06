from sqlalchemy import Column, String, JSON, DateTime, Text
from sqlalchemy.dialects.sqlite import BLOB
from app.db.database import Base
from datetime import datetime
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class SchemaModel(Base):
    __tablename__ = "schemas"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, unique=True, index=True)
    fields = Column(JSON) # Stores the Dict[str, str] definition
    created_at = Column(DateTime, default=datetime.utcnow)

class ExtractionResultModel(Base):
    __tablename__ = "extraction_results"

    id = Column(String, primary_key=True, default=generate_uuid)
    schema_id = Column(String, index=True)
    schema_name = Column(String)
    extracted_data = Column(JSON)
    raw_text = Column(Text, nullable=True)
    source_file_path = Column(String, nullable=True)
    processed_at = Column(DateTime, default=datetime.utcnow)
