from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db.database import get_db
from app.models.policy import Policy
from app.services.policy_matcher import evaluate_policy_impact

router = APIRouter(prefix="/policies", tags=["Policy Impact"])

# Request Schema
class EvaluationRequest(BaseModel):
    policy_id: int
    user_profile: dict  # {"state": "Kerala", "occupation": "Student"}

@router.post("/evaluate")
def evaluate_policy(
    request: EvaluationRequest,
    db: Session = Depends(get_db)
):
    # Fetch Policy
    policy = db.query(Policy).filter(Policy.id == request.policy_id).first()

    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    # Run Logic
    result = evaluate_policy_impact(policy, request.user_profile)

    return {
        "policy": policy.title,
        "impact": result["impact"],
        "reason": result["reason"]
    }

# Helper to add test data easily via API
@router.post("/seed")
def seed_test_policy(db: Session = Depends(get_db)):
    # Check if exists to avoid duplicates
    existing = db.query(Policy).filter(Policy.title == "National Healthcare Access Policy").first()
    if not existing:
        new_policy = Policy(
            title="National Healthcare Access Policy",
            description="Improves access to healthcare services across southern states.",
            affected_states="Tamil Nadu,Karnataka",
            target_groups="Student,Worker",
            status="Active"
        )
        db.add(new_policy)
        db.commit()
        return {"status": "Created test policy"}
    return {"status": "Policy already exists"}
