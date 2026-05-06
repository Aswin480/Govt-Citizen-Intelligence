from app.config import settings

# --- MOCKED SUMMARIZER SERVICE ---
# Removed heavy libraries (transformers, torch) for performance.

def get_summarizer_pipeline():
    print("[AI] Mock Summarizer Pipeline accessed.")
    return None

def generate_summary(text: str):
    """
    Mocked version of summarizer.
    Returns the first few characters of the text or a placeholder.
    """
    # Safety: If text is too short, return as is
    if len(text) < 100:
        return text
    
    return f"[MOCK SUMMARY] {text[:100]}... (Summary generation disabled for performance)"

def explain_debate(debate_text: str, sentiment_result: str):
    """
    Combines summary + sentiment to give context.
    """
    summary = generate_summary(debate_text)
    
    explanation = {
        "summary": summary,
        "context_note": f"The speaker expressed a {sentiment_result} sentiment. The core argument focuses on: [Mock Context]..."
    }
    return explanation
