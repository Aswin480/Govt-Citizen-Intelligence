from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services.nexus_graph_engine import NexusGraphEngine
from pydantic import BaseModel
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
import networkx as nx

router = APIRouter()

# --- Schemas ---
class GraphQuery(BaseModel):
    query: str # e.g. "Modi Infrastructure"

class GraphResponse(BaseModel):
    results: List[Dict[str, Any]]
    stats: Dict[str, Any]

# --- Endpoints ---

@router.post("/graph/query", response_model=GraphResponse)
def query_knowledge_graph(
    q: GraphQuery,
    db: Session = Depends(get_db)
):
    """
    ENGINE 2.0: Holographic Search.
    Finds entities and their hidden relationships in the Nexus Graph.
    """
    try:
        # Initialize Engine (In prod, this would be a singleton or loaded in startup)
        nexus = NexusGraphEngine(db)
        
        # Execute Holographic Search
        results = nexus.context_search(q.query)
        stats = nexus.get_stats()
        
        return {
            "results": results,
            "stats": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/graph/visualize")
def get_graph_visualization(db: Session = Depends(get_db)):
    """
    Returns the full graph structure for visualizers (e.g. D3.js / Cytoscape)
    """
    nexus = NexusGraphEngine(db)
    # Convert NetworkX graph to JSON suitable for frontend
    data = nx.node_link_data(nexus.graph)
    return data

@router.get("/graph/pulse")
def get_governance_predictions(
    region: str = "National",
    db: Session = Depends(get_db)
):
    """
    ENGINE 2.0 (Phase 4): Predictive Governance Pulse.
    Returns 'Lead Indicators' based on signal density (e.g., unexpected tender spikes).
    """
    from app.services.predictive_pulse import PulseEngine
    
    pulse = PulseEngine(db)
    
    # If region is "National", aggregate major states
    if region.lower() == "national":
        predictions = pulse.get_national_pulse()
    else:
        predictions = pulse.generate_lead_indicators(region)
        
    return {
        "region": region,
        "lead_indicators": predictions,
        "disclaimer": "AI-derived signals. Not official government announcements."
    }
