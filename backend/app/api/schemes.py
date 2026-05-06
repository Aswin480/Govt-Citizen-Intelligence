from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.db.database import get_db
from app.models.scheme import Scheme
from app.services.scheme_matcher import evaluate_scheme_eligibility

router = APIRouter(prefix="/schemes", tags=["Scheme Eligibility"])

@router.get("/")
def get_all_schemes(db: Session = Depends(get_db)):
    """Fetch all available schemes."""
    return db.query(Scheme).all()

@router.post("/check-eligibility")
def check_all_schemes(user_profile: dict, db: Session = Depends(get_db)):
    """
    Checks user profile against ALL schemes in the database.
    Returns list of eligible schemes.
    """
    all_schemes = db.query(Scheme).all()
    eligible_list = []
    
    for scheme in all_schemes:
        result = evaluate_scheme_eligibility(scheme, user_profile)
        if result["status"] == "Eligible":
            eligible_list.append({
                "scheme_name": scheme.name,
                "benefit": scheme.description,
                "ministry": "Social Welfare" # Placeholder
            })
            
    return {
        "eligible_schemes_count": len(eligible_list),
        "schemes": eligible_list
    }
class SchemeEvaluationRequest(BaseModel):
    scheme_id: int
    user_profile: dict 

@router.post("/evaluate")
def evaluate_scheme(
    request: SchemeEvaluationRequest,
    db: Session = Depends(get_db)
):
    scheme = db.query(Scheme).filter(Scheme.id == request.scheme_id).first()

    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")

    result = evaluate_scheme_eligibility(scheme, request.user_profile)

    return {
        "scheme": scheme.name,
        "status": result["status"],
        "reason": result["reason"]
    }

@router.post("/seed")
def seed_scheme(db: Session = Depends(get_db)):
    # Check duplicate
    existing = db.query(Scheme).filter(Scheme.name == "Post-Matric Scholarship for Students").first()
    if existing:
         return {"status": "Scheme already exists", "id": existing.id}
    
    new_scheme = Scheme(
        name="Post-Matric Scholarship for Students",
        description="Financial assistance for students from economically weaker sections.",
        applicable_states="Tamil Nadu,Karnataka",
        eligible_occupations="Student",
        income_limit=250000
    )
    db.add(new_scheme)
    db.commit()
    db.refresh(new_scheme)
    return {"status": "Created test scheme", "id": new_scheme.id}

class SchemeCreate(BaseModel):
    name: str
    description: str
    applicable_states: Optional[str] = None
    eligible_occupations: Optional[str] = None
    income_limit: Optional[int] = None
    official_pdf_url: Optional[str] = None

class SchemeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    applicable_states: Optional[str] = None
    eligible_occupations: Optional[str] = None
    income_limit: Optional[int] = None
    official_pdf_url: Optional[str] = None

@router.post("/")
def create_scheme(scheme: SchemeCreate, db: Session = Depends(get_db)):
    db_scheme = Scheme(
        name=scheme.name,
        description=scheme.description,
        applicable_states=scheme.applicable_states,
        eligible_occupations=scheme.eligible_occupations,
        income_limit=scheme.income_limit,
        official_pdf_url=scheme.official_pdf_url
    )
    db.add(db_scheme)
    db.commit()
    db.refresh(db_scheme)
    return db_scheme

@router.put("/{scheme_id}")
def update_scheme(scheme_id: int, scheme_in: SchemeUpdate, db: Session = Depends(get_db)):
    db_scheme = db.query(Scheme).filter(Scheme.id == scheme_id).first()
    if not db_scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
    
    update_data = scheme_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_scheme, field, value)
        
    db.commit()
    db.refresh(db_scheme)
    return db_scheme

@router.delete("/{scheme_id}")
def delete_scheme(scheme_id: int, db: Session = Depends(get_db)):
    db_scheme = db.query(Scheme).filter(Scheme.id == scheme_id).first()
    if not db_scheme:
         raise HTTPException(status_code=404, detail="Scheme not found")
    
    db.delete(db_scheme)
    db.commit()
    return {"status": "deleted"}
