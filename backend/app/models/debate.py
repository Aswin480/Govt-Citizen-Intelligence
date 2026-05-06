from sqlalchemy import Column, Integer, String, Text, Date, Float
from app.db.base import Base

class RawDebate(Base):
    __tablename__ = "raw_debates"

    id = Column(Integer, primary_key=True, index=True)
    
    # Core Data (Flat Structure for easy Ingestion)
    text = Column(Text, nullable=False)
    date = Column(Date, nullable=False, index=True)
    
    # Speaker Info (Stored as Strings as per Step 5 req)
    speaker = Column(String, index=True)      # e.g., "Amit Shah"
    party = Column(String, index=True)        # e.g., "BJP"
    constituency = Column(String, nullable=True)
    
    # Metadata
    session = Column(String, nullable=True)   # "Monsoon 2024"
    house = Column(String, nullable=True)     # "Lok Sabha"
    topic = Column(String, nullable=True)     # "Infrastructure"
    language = Column(String, default="en")
    
    # AI Analysis
    sentiment_score = Column(Float, nullable=True)
    primary_emotion = Column(String, nullable=True)

    # Note: Removed ForeignKey to independent 'speakers' table to simplify ingestion pipeline
