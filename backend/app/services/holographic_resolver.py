from datetime import datetime
from sqlalchemy.orm import Session
from app.models.state import StateData
from app.models.parliament import Member
import networkx as nx
import re

class HolographicResolver:
    """
    ENGINE 2.0 (Phase 2): Holographic Entity Resolution.
    Maps messy, unstructured text to precise Graph Entities.
    Example: "The Yogi Govt" -> node:person_yogi_adityanath + node:region_uttar_pradesh
    """
    
    def __init__(self, db: Session, graph: nx.DiGraph):
        self.db = db
        self.graph = graph
        self.alias_map = self._build_alias_map()

    def _build_alias_map(self):
        """
        Builds a high-speed lookup table for entity resolution.
        Maps nicknames, titles, and common variations to canonical IDs.
        """
        print("🧠 [HOLOGRAPHIC] Building Neural Alias Map...")
        alias_map = {}
        
        # 1. Map States (e.g. "UP" -> "Uttar Pradesh")
        states = self.db.query(StateData).all()
        for s in states:
            canonical_id = s.id
            # Standard variations
            variations = [s.name.lower(), s.id.lower()]
            if s.name == "Uttar Pradesh": variations.append("up")
            if s.name == "Madhya Pradesh": variations.append("mp")
            if s.name == "Andhra Pradesh": variations.append("ap")
            if s.name == "Himachal Pradesh": variations.append("hp")
            
            for v in variations:
                alias_map[v] = {"id": canonical_id, "type": "Region"}

            # Map CMs
            if s.chief_minister_name:
                cm_id = f"person_{s.chief_minister_name.replace(' ', '_')}"
                cm_name = s.chief_minister_name.lower()
                # "Yogi", "CM Yogi", "Adityanath"
                parts = cm_name.split()
                alias_map[cm_name] = {"id": cm_id, "type": "Person"}
                for part in parts:
                    if len(part) > 3: # Avoid "The" or "Dr"
                        alias_map[part] = {"id": cm_id, "type": "Person"}

        # 2. Map MPs (e.g. "Modi" -> "Narendra Modi")
        mps = self.db.query(Member).all()
        for mp in mps:
            mp_id = f"mp_{mp.name.replace(' ', '_')}_{mp.id}"
            mp_name = mp.name.lower()
            alias_map[mp_name] = {"id": mp_id, "type": "Person"}
            # Last name inference (risky but useful for context)
            last_name = mp_name.split()[-1]
            if len(last_name) > 3:
                # Only map if unique? For MVP, we overwrite (last write wins)
                # In prod, we'd use a list of collisions
                alias_map[last_name] = {"id": mp_id, "type": "Person"}

        print(f"✅ [HOLOGRAPHIC] Mapped {len(alias_map)} aliases.")
        return alias_map

    def resolve_entities(self, text: str):
        """
        Scans text and returns a list of unique Graph Node IDs found.
        """
        found_entities = []
        text_lower = text.lower()
        
        # 1. Direct Keyword Search (Fastest)
        # O(N) scan where N is alias map size. For 10k entities, this is <10ms.
        for alias, target in self.alias_map.items():
            # Whole word matching using regex to avoid partial matches (e.g. "Man" in "Manipur")
            if re.search(r'\b' + re.escape(alias) + r'\b', text_lower):
                found_entities.append(target)

        # deduplicate
        unique = {v['id']: v for v in found_entities}.values()
        return list(unique)

    def link_content_to_graph(self, content_id, content_type, text):
        """
        Visualizes the 'Invisible Threads'.
        Takes a new document (Budget PDF, News Article) and links it to the Graph.
        """
        entities = self.resolve_entities(text)
        links = []
        
        for entity in entities:
            # Create a virtual edge (relation)
            # Content -> MENTIONS -> Entity
            link = {
                "source_id": content_id,
                "source_type": content_type,
                "target_id": entity['id'],
                "target_type": entity['type'],
                "relation": "MENTIONS"
            }
            links.append(link)
            
            # In a real graph DB, we would insert this edge here:
            # self.graph.add_edge(content_id, entity['id'], relation="MENTIONS")
            
        return links
