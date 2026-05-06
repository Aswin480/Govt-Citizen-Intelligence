from sqlalchemy import Column, Integer, String, Text
from app.db.base import Base

class Scheme(Base):
    __tablename__ = "schemes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=False)

    applicable_states = Column(String, nullable=True)
    eligible_occupations = Column(String, nullable=True)
    income_limit = Column(Integer, nullable=True)
    official_pdf_url = Column(String, nullable=True)
