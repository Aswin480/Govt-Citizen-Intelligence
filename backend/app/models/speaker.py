from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.db.base import Base


class Speaker(Base):
    __tablename__ = "speakers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    constituency = Column(String, nullable=True)

    party_id = Column(Integer, ForeignKey("parties.id"))

    party = relationship("Party", back_populates="speakers")
    # debates = relationship("Debate", back_populates="speaker")  # Disabled for flat ingestion
