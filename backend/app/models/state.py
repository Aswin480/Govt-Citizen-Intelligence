from sqlalchemy import Column, Integer, String, JSON, Text
from app.db.base import Base

class StateData(Base):
    __tablename__ = "states"

    id = Column(String, primary_key=True, index=True) # State Code e.g., 'AP', 'KA'
    name = Column(String, index=True)
    type = Column(String) # 'state' or 'ut'
    capital = Column(String, nullable=True)
    
    # Leadership
    chief_minister_name = Column(String, nullable=True)
    chief_minister_image = Column(String, nullable=True)
    governor_name = Column(String, nullable=True)
    governor_image = Column(String, nullable=True)
    
    total_seats = Column(Integer, default=0)
    
    # Composition stored as JSON
    # format: [{"party": "BJP", "seats": 10, "color": "..."}]
    composition = Column(JSON, nullable=True) 

    # Real-World Metadata (to replace mock data)
    party = Column(String, nullable=True) # Ruling Party
    alliance = Column(String, nullable=True) # Ruling Alliance
    description = Column(Text, nullable=True) # State summary
    
    # Economic & Social Metrics (JSON)
    # { "gdpGrowth": 8.5, "literacy": 75.0, ... }
    metrics = Column(JSON, default={}) 
