from datetime import datetime
from sqlalchemy.orm import Session
from app.models.debate import RawDebate
from app.services.nexus_graph_engine import NexusGraphEngine
import re

class SentinelAgent:
    """
    ENGINE 2.0 (Phase 3): The Watchdog
    Autonomous Agent that audits content for Risks, Bias, and Urgency.
    """
    
    def __init__(self, db: Session):
        self.db = db
        # Risk Keywords (Simple heuristic for MVP, can be upgraded to BERT)
        self.risk_patterns = {
            "fiscal_risk": ["fiscal deficit", "overspending", "debt crisis", "inflation spike"],
            "corruption_flag": ["single bidder", "undue favour", "scam", "irregularity", "audit objection"],
            "social_unrest": ["protest", "riot", "strike", "blockade", "curfew"],
            "urgency": ["immediate effect", "urgent", "emergency", "crisis"]
        }

    def audit_debate(self, debate_id: int):
        """
        Scans a specific debate for critical flags.
        """
        debate = self.db.query(RawDebate).filter(RawDebate.id == debate_id).first()
        if not debate: return None
        
        text = debate.text.lower()
        flags = []
        
        # 1. Pattern Matching
        for category, keywords in self.risk_patterns.items():
            for kw in keywords:
                if kw in text:
                    flags.append({
                        "category": category,
                        "keyword": kw,
                        "confidence": 0.85 # High confidence for exact match
                    })
        
        # 2. Update Graph Metadata (if we had a writeable graph instance)
        # In a real graph DB, we would add a property to the Node:
        # SET node.risk_score = len(flags)
        
        if flags:
            print(f"🚨 [SENTINEL] Risk Detected in Debate #{debate_id}: {len(flags)} flags.")
            return {"status": "flagged", "flags": flags}
            
        return {"status": "clean", "flags": []}

    def run_nightly_audit(self):
        """
        Scans all recent debates.
        """
        print("🐕 [SENTINEL] Starting Nightly Audit...")
        recent_debates = self.db.query(RawDebate).order_by(RawDebate.date.desc()).limit(50).all()
        
        report = []
        for debate in recent_debates:
            result = self.audit_debate(debate.id)
            if result['status'] == 'flagged':
                report.append({
                    "debate_id": debate.id,
                    "speaker": debate.speaker,
                    "flags": result['flags']
                })
        
        print(f"✅ [SENTINEL] Audit Complete. {len(report)} issues found.")
        return report
