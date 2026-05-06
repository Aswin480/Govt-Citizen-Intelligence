from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.db.base import Base


class Party(Base):
    __tablename__ = "parties"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)      # e.g., "Bharatiya Janata Party"
    abbreviation = Column(String, unique=True, nullable=True) # e.g., "BJP"
    color = Column(String, default="#808080")               # e.g., "#FF9933"
    alliance = Column(String, nullable=True)                # e.g., "NDA"
    logo_url = Column(String, nullable=True)

    speakers = relationship("Speaker", back_populates="party")
