from sqlalchemy.orm import Session
# from app.models.debate import RawDebate # Keep if needed for typing, but we are mocking result behavior
# from app.config import settings

# --- MOCKED SENTIMENT SERVICE ---
# Removed heavy libraries (transformers, torch) for performance.

def get_sentiment_pipeline():
    print("[AI] Mock Sentiment Pipeline accessed.")
    return None

def analyze_aspect_sentiment(db: Session, aspect_keywords: list[str]):
    """
    Mocked version of aspect-based sentiment analysis.
    Returns dummy data to satisfy the frontend contract without loading models.
    """
    print(f"[AI] Mock Sentiment Analysis triggered for: {aspect_keywords}")
    
    # Return a static mock response
    results = [
        {
            "debate_id": 1,
            "speaker": "Mock Speaker 1",
            "party": "Party A",
            "speech_text": "This is a mock speech content for testing purposes specifically regarding " + (aspect_keywords[0] if aspect_keywords else "general topics") + ".",
            "sentiment_label": "Positive",
            "sentiment_score": 0.99,
            "explanation": "This is a mock explanation generated without AI models.",
            "debate_date": "2024-01-01"
        },
        {
            "debate_id": 2,
            "speaker": "Mock Speaker 2",
            "party": "Party B",
            "speech_text": "Another mock speech about " + (aspect_keywords[0] if aspect_keywords else "something") + ".",
            "sentiment_label": "Negative",
            "sentiment_score": 0.85,
            "explanation": "Mock explanation for negative sentiment.",
            "debate_date": "2024-01-02"
        }
    ]

    return {
        "aspect": aspect_keywords,
        "total_matches": len(results),
        "results": results
    }
