from fastapi import APIRouter, Response
from pydantic import BaseModel
from app.services.poster_service import create_policy_poster as create_viral_poster
from app.services.poster_generator import generate_policy_poster as create_neutral_poster
from app.services.faq_generator import explain_before_react

router = APIRouter(prefix="/posters", tags=["Visuals"])

class PosterRequest(BaseModel):
    topic: str
    summary: str
    sentiment: str

@router.post("/generate")
def generate_poster(request: PosterRequest):
    # Generate Image (Viral Style)
    image_bytes = create_viral_poster(
        request.topic, 
        request.summary, 
        request.sentiment
    )
    
    # Return as an actual image file (PNG)
    return Response(content=image_bytes.getvalue(), media_type="image/png")

@router.post("/policy")
def create_policy_poster_endpoint(title: str, description: str):
    """
    Generates a neutral, safe explanation poster.
    """
    explanation = explain_before_react(title, description)

    poster_path = create_neutral_poster(
        title=title,
        explanation=explanation
    )

    return {
        "message": "Poster generated successfully",
        "poster_path": poster_path
    }
