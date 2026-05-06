from fastapi import APIRouter
import json
import random
import os

router = APIRouter()

DATA_DIR = os.path.join(os.path.dirname(__file__), "../../data")
SCORES_FILE = os.path.join(DATA_DIR, "mp_reputation_scores.json")
EVIDENCE_FILE = os.path.join(DATA_DIR, "mp_score_evidence.json")

def load_json(filepath):
    if not os.path.exists(filepath):
        return []
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)

@router.get("/intel/brief")
def get_intel_brief():
    """
    Generates a Daily Intelligence Brief based on MP Reputation & Evidence.
    """
    scores = load_json(SCORES_FILE)
    evidence = load_json(EVIDENCE_FILE)

    if not scores or not evidence:
        return {"briefs": []}

    briefs = []

    # 1. Identify Top Movers (High Impact)
    # Sort evidence by score descending to find "High Impact" speeches
    high_impact_evidence = sorted(evidence, key=lambda x: x.get('score', 0), reverse=True)[:5]

    for item in high_impact_evidence:
        mp_name = item.get('mp_name')
        topic = item.get('core_value')
        score = item.get('score')
        speech = item.get('speech', '')[:150] + "..." # Snippet

        briefs.append({
            "type": "ALERT",
            "level": "HIGH" if score > 8 else "MEDIUM",
            "title": f"High Impact Activity by {mp_name}",
            "description": f"{mp_name} made a significant statement on {topic} (Impact Score: {score:.1f}).",
            "snippet": speech,
            "mp_name": mp_name,
            "topic": topic
        })

    # 2. Identify "Silent" or "Low Performance" MPs
    # MPs with low total scores in critical areas
    for mp in random.sample(scores, min(5, len(scores))):
        core_scores = mp.get('core_values_score', {})
        low_areas = [k for k, v in core_scores.items() if v < 2.0]
        
        if low_areas:
             briefs.append({
                "type": "RISK",
                "level": "MEDIUM",
                "title": f"Performance Gap: {mp['mp_name']}",
                "description": f"Data indicates minimal activity in: {', '.join(low_areas[:2])}.",
                "mp_name": mp['mp_name'],
                "topic": "Performance"
            })

    return {"briefs": briefs}
