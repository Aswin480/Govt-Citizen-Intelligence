from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.parliament import Member, House
from app.services.scraper_service import ingest_sample_debate
from pydantic import BaseModel
from typing import List, Optional
import json
import os
from difflib import get_close_matches

DATA_DIR = os.path.join(os.path.dirname(__file__), "../data")
SCORES_FILE = os.path.join(DATA_DIR, "mp_reputation_scores.json")
EVIDENCE_FILE = os.path.join(DATA_DIR, "mp_score_evidence.json")

router = APIRouter(prefix="/parliament", tags=["Parliament"])

# --- SCHEMAS ---
class MemberCreate(BaseModel):
    name: str
    party: str
    constituency: str
    house_id: int
    state_id: Optional[str] = None
    profile_image: Optional[str] = None

class MemberUpdate(BaseModel):
    name: Optional[str] = None
    party: Optional[str] = None
    constituency: Optional[str] = None
    state_id: Optional[str] = None
    profile_image: Optional[str] = None

class HouseCreate(BaseModel):
    name: str
    type: str # 'lok_sabha', 'rajya_sabha' or 'assembly'
    state: Optional[str] = None
    image_url: Optional[str] = None

# --- HOUSE ROUTES ---
@router.post("/houses/")
def create_house(house: HouseCreate, db: Session = Depends(get_db)):
    db_house = db.query(House).filter(House.name == house.name).first()
    if db_house:
        raise HTTPException(status_code=400, detail="House already exists")
    new_house = House(
        name=house.name, 
        type=house.type, 
        state=house.state,
        image_url=house.image_url
    )
    db.add(new_house)
    db.commit()
    db.refresh(new_house)
    return new_house

@router.get("/houses/")
def get_houses(db: Session = Depends(get_db)):
    return db.query(House).all()

# --- MEMBER ROUTES ---
@router.get("/members/")
def get_members(house_name: Optional[str] = None, state_id: Optional[str] = None, house_type: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Member)
    if house_name:
        query = query.join(House).filter(House.name == house_name)
    if house_type:
        query = query.join(House).filter(House.type == house_type)
    if state_id:
        query = query.filter(Member.state_id == state_id)
    return query.all()

@router.post("/members/")
def create_member(member: MemberCreate, db: Session = Depends(get_db)):
    new_member = Member(
        name=member.name,
        party=member.party,
        constituency=member.constituency,
        house_id=member.house_id,
        state_id=member.state_id,
        profile_image=member.profile_image
    )
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    return new_member

@router.put("/members/{member_id}")
def update_member(member_id: int, member_update: MemberUpdate, db: Session = Depends(get_db)):
    db_member = db.query(Member).filter(Member.id == member_id).first()
    if not db_member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    if member_update.name:
        db_member.name = member_update.name
    if member_update.party:
        db_member.party = member_update.party
    if member_update.constituency:
        db_member.constituency = member_update.constituency
    if member_update.profile_image:
        db_member.profile_image = member_update.profile_image
        
    db.commit()
    db.refresh(db_member)
    return db_member

@router.delete("/members/{member_id}")
def delete_member(member_id: int, db: Session = Depends(get_db)):
    db_member = db.query(Member).filter(Member.id == member_id).first()
    if not db_member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    db.delete(db_member)
    db.commit()
    return {"status": "success", "message": "Member deleted"}

# --- PERFORMANCE & METRICS ---
@router.get("/members/{member_id}/performance")
def get_member_performance(member_id: int, db: Session = Depends(get_db)):
    """
    Returns the Elite Performance Profile for a member.
    Merges DB data with the JSON 'Reputation Scores' and 'Evidence' files.
    """
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    # Load JSON Data
    try:
        with open(SCORES_FILE, "r", encoding="utf-8") as f:
            all_scores = json.load(f)
        with open(EVIDENCE_FILE, "r", encoding="utf-8") as f:
            all_evidence = json.load(f)
    except Exception as e:
        print(f"Error loading performance data: {e}")
        return {"error": "Data sources unavailable"}

    # Find matching MP in JSON (Fuzzy Match Name)
    mp_names = [m['mp_name'] for m in all_scores]
    matches = get_close_matches(member.name, mp_names, n=1, cutoff=0.6)
    
    if not matches:
        return {
            "mp_name": member.name, 
            "scores": {}, 
            "speeches": []
        }

    matched_name = matches[0]
    
    # Get Scores
    mp_score_data = next((m for m in all_scores if m['mp_name'] == matched_name), None)
    scores = mp_score_data.get('core_values_score', {}) if mp_score_data else {}

    # Get Speeches (Limit to Top 10 by score)
    mp_evidence = [e for e in all_evidence if e['mp_name'] == matched_name]
    top_speeches = sorted(mp_evidence, key=lambda x: x.get('score', 0), reverse=True)[:10]

    return {
        "mp_name": member.name,
        "matched_name": matched_name, # Debug info
        "scores": scores,
        "speeches": top_speeches
    }

# --- AGGREGATED MEMBER DETAIL ENDPOINT ---
@router.get("/members/{member_id}/full")
def get_member_full_profile(member_id: int, db: Session = Depends(get_db)):
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    performance_response = get_member_performance(member_id, db)
    # If performance_response already contains error, keep that structure
    if isinstance(performance_response, dict) and performance_response.get('error'):
        performance_response = { 'scores': {}, 'speeches': [], 'error': performance_response.get('error') }

    return {
        "member": {
            "id": member.id,
            "name": member.name,
            "party": member.party,
            "constituency": member.constituency,
            "state_id": member.state_id,
            "house_id": member.house_id,
            "profile_image": member.profile_image
        },
        "performance": performance_response
    }

# --- INGESTION ---
@router.post("/ingest-sample")
def ingest_sample(db: Session = Depends(get_db)):
    try:
        # Path to our sample file
        file_path = "data/debates/sample_debate.html"
        
        count = ingest_sample_debate(file_path, db)
        
        return {
            "message": "Ingestion successful", 
            "records_added": count,
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
