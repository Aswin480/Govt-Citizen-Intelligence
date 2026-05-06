from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base

class House(Base):
    __tablename__ = "houses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)  # e.g., "Lok Sabha", "Rajya Sabha", "Kerala Assembly"
    type = Column(String)  # "National" or "State"
    state = Column(String, nullable=True)  # "India" or "Kerala", "Tamil Nadu"
    video_stream_url = Column(String, nullable=True)  # YouTube Live Link
    image_url = Column(String, nullable=True)

    members = relationship("Member", back_populates="house")
    bills = relationship("Bill", back_populates="house")
    debates = relationship("Debate", back_populates="house")

class Member(Base):
    __tablename__ = "members"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    constituency = Column(String)
    party = Column(String)
    profile_image = Column(String, nullable=True)
    house_id = Column(Integer, ForeignKey("houses.id"))

    house = relationship("House", back_populates="members")
    transcripts = relationship("Transcript", back_populates="member")

class Bill(Base):
    __tablename__ = "bills"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    status = Column(String)  # "Introduced", "Passed", "Pending"
    introduced_date = Column(Date)
    document_url = Column(String)
    house_id = Column(Integer, ForeignKey("houses.id"))

    house = relationship("House", back_populates="bills")

class Debate(Base):
    __tablename__ = "debates"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    date = Column(DateTime, default=datetime.utcnow)
    video_link = Column(String, nullable=True)
    house_id = Column(Integer, ForeignKey("houses.id"))

    house = relationship("House", back_populates="debates")
    transcripts = relationship("Transcript", back_populates="debate")

class Transcript(Base):
    __tablename__ = "transcripts"

    id = Column(Integer, primary_key=True, index=True)
    debate_id = Column(Integer, ForeignKey("debates.id"))
    member_id = Column(Integer, ForeignKey("members.id"))
    content = Column(Text)
    language = Column(String, default="en")
    sentiment_score = Column(Float, nullable=True)  # AI Analysis result (-1.0 to 1.0)

    debate = relationship("Debate", back_populates="transcripts")
    member = relationship("Member", back_populates="transcripts")
