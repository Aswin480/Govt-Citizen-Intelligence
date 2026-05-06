from fastapi import APIRouter
from app.services.faq_generator import (
    explain_before_react,
    generate_citizen_faqs
)

router = APIRouter(prefix="/explain", tags=["Explainability"])

@router.get("/policy")
def explain_policy(title: str, description: str):
    return {
        "explanation": explain_before_react(title, description),
        "faqs": generate_citizen_faqs()
    }
