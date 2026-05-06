import json
import os
from sqlalchemy.orm import Session
from app.models.policy import Policy
from app.models.scheme import Scheme

def ingest_sample_policies(db: Session):
    """
    Reads sample_schemes.json and populates the Policy and Scheme tables.
    """
    file_path = "data/policies/sample_schemes.json"
    
    if not os.path.exists(file_path):
        return {"error": "Policy data file not found."}

    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    count = 0
    for item in data:
        # 1. Create or Get Policy
        policy = db.query(Policy).filter(Policy.title == item["policy_title"]).first()
        if not policy:
            policy = Policy(
                title=item["policy_title"],
                summary=item["description"], # Using description as summary for now
                category="General",
                status="Active"
            )
            db.add(policy)
            db.commit()
            db.refresh(policy)

        # 2. Create Scheme linked to Policy
        scheme = db.query(Scheme).filter(Scheme.name == item["scheme_name"]).first()
        if not scheme:
            new_scheme = Scheme(
                name=item["scheme_name"],
                description=item["description"],
                ministry=item["ministry"],
                application_link=item["application_link"],
                eligibility_criteria=json.dumps(item["eligibility_rules"]), # Store rules as JSON string
                policy_id=policy.id  # Link to parent policy
            )
            db.add(new_scheme)
            count += 1
    
    db.commit()
    return count
