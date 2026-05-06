from fastapi import APIRouter
from app.services.session_metadata_service import fetch_current_session_metadata

router = APIRouter(prefix="/sessions", tags=["Live Sessions"])

@router.get("/current")
def get_current_session():
    """
    Returns the current status of the Parliamentary Session from official sources.
    """
    return fetch_current_session_metadata()
