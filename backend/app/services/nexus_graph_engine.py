from datetime import datetime
from sqlalchemy.orm import Session
from app.models.state import StateData
from app.models.parliament import Member, Bill, House
from app.models.budget import Budget
import networkx as nx
import json
import os
from neo4j import GraphDatabase, exceptions as neo4j_exceptions

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://127.0.0.1:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "***REMOVED***")

class NexusGraphEngine:
    """
    ENGINE 2.0: The 'Shadow Government API' 
    Upgraded to Enterprise 10/10 level via Neo4j Graph Database.
    If Neo4j fails to connect, gracefully falls back to NetworkX in-memory.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.use_neo4j = False
        self.driver = None
        self.graph = nx.DiGraph() # Fallback graph
        
        try:
            self.driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
            self.driver.verify_connectivity()
            self.use_neo4j = True
            print("🚀 [ENGINE 2.0] Connected to Neo4j Enterprise Graph Database successfully.")
        except Exception as e:
            print(f"⚠️ [ENGINE 2.0] Neo4j Connection Failed ({e}). Falling back to NetworkX in-memory graph.")
            self.use_neo4j = False
            
        self.build_initial_graph()

    def close(self):
        if self.driver:
            self.driver.close()

    def build_initial_graph(self):
        """
        Phase 1: Hydrate the Graph with Core Entities
        Nodes: Person, Region, Org, Policy, Budget
        Edges: GOVERNS, REPRESENTS, FUNDS
        """
        print("🕸️ [NEXUS] Hydrating Knowledge Graph...")
        
        if self.use_neo4j:
            self._hydrate_neo4j()
        else:
            self._hydrate_networkx()
            
    def _hydrate_neo4j(self):
        """Build Graph in Neo4j"""
        with self.driver.session() as session:
            # 1. ADD REGIONS (States/UTs)
            states = self.db.query(StateData).all()
            for s in states:
                # Add State Node
                session.run("MERGE (r:Region {id: $id}) ON CREATE SET r.name = $name, r.category = 'State'", 
                            id=s.id, name=s.name)
                
                # CM Node
                if s.chief_minister_name:
                    cm_id = f"person_{s.chief_minister_name.replace(' ', '_')}"
                    session.run("MERGE (p:Person {id: $cm_id}) ON CREATE SET p.name = $name, p.role = 'CM'",
                                cm_id=cm_id, name=s.chief_minister_name)
                    session.run("""
                        MATCH (p:Person {id: $cm_id}), (r:Region {id: $state_id})
                        MERGE (p)-[:GOVERNS]->(r)
                    """, cm_id=cm_id, state_id=s.id)

            # 2. ADD MPs
            mps = self.db.query(Member).all()
            for mp in mps:
                mp_id = f"mp_{mp.name.replace(' ', '_')}_{mp.id}"
                session.run("MERGE (p:Person {id: $mp_id}) ON CREATE SET p.name = $name, p.party = $party, p.role = 'MP'",
                            mp_id=mp_id, name=mp.name, party=mp.party)
                
                if mp.state_id:
                    session.run("""
                        MATCH (p:Person {id: $mp_id}), (r:Region {id: $state_id})
                        MERGE (p)-[:REPRESENTS_STATE]->(r)
                    """, mp_id=mp_id, state_id=mp.state_id)

            # 3. ADD BUDGETS
            budgets = self.db.query(Budget).all()
            for b in budgets:
                bud_id = f"budget_{b.year}_{b.region}"
                session.run("MERGE (b:Budget {id: $bud_id}) ON CREATE SET b.year = $year, b.amount = $amount",
                            bud_id=bud_id, year=b.year, amount=b.total_size)
                
                session.run("""
                    MATCH (b:Budget {id: $bud_id}), (r:Region {name: $region_name})
                    MERGE (b)-[:FUNDS]->(r)
                """, bud_id=bud_id, region_name=b.region)
                
        print("✅ [NEXUS Neo4j] Graph Data Merged successfully.")

    def _hydrate_networkx(self):
        """Fallback in-memory hydration"""
        states = self.db.query(StateData).all()
        for s in states:
            self.graph.add_node(s.id, type="Region", name=s.name, category="State")
            if s.chief_minister_name:
                cm_id = f"person_{s.chief_minister_name.replace(' ', '_')}"
                self.graph.add_node(cm_id, type="Person", name=s.chief_minister_name, role="CM")
                self.graph.add_edge(cm_id, s.id, relation="GOVERNS")

        mps = self.db.query(Member).all()
        for mp in mps:
            mp_id = f"mp_{mp.name.replace(' ', '_')}_{mp.id}"
            self.graph.add_node(mp_id, type="Person", name=mp.name, party=mp.party, role="MP")
            if mp.state_id:
                self.graph.add_edge(mp_id, mp.state_id, relation="REPRESENTS_STATE")

        budgets = self.db.query(Budget).all()
        for b in budgets:
            bud_id = f"budget_{b.year}_{b.region}"
            self.graph.add_node(bud_id, type="Budget", year=b.year, amount=b.total_size)
            region_node = next((n for n, d in self.graph.nodes(data=True) if d.get('name') == b.region), None)
            if region_node:
                self.graph.add_edge(bud_id, region_node, relation="FUNDS")

    def context_search(self, query):
        """
        Agentic GraphRAG / Holographic Search
        """
        if self.use_neo4j:
            return self._search_neo4j(query)
        else:
            return self._search_networkx(query)
            
    def _search_neo4j(self, query):
        results = []
        # Case insensitive regex match on name properties across all Node types
        cypher = """
        MATCH (n)
        WHERE n.name =~ '(?i).*' + $query + '.*' 
        OPTIONAL MATCH (n)-[r]->(out)
        OPTIONAL MATCH (in)-[r2]->(n)
        RETURN n, collect(DISTINCT {relation: type(r), target: out}) AS outgoing,
               collect(DISTINCT {relation: 'Is ' + type(r2) + ' By', source: in}) AS incoming
        LIMIT 10
        """
        with self.driver.session() as session:
            records = session.run(cypher, query=query.split()[0]) # Simplified single term keyword matching
            for record in records:
                node_dict = dict(record['n'])
                connections = []
                for out in record['outgoing']:
                    if out['target']:
                        connections.append({"relation": out['relation'], "target": dict(out['target'])})
                for inc in record['incoming']:
                    if inc['source']:
                        connections.append({"relation": inc['relation'], "source": dict(inc['source'])})
                        
                results.append({
                    "entity": node_dict,
                    "connections": connections
                })
        return results

    def _search_networkx(self, query):
        query_terms = query.lower().split()
        relevant_nodes = []
        for node, data in self.graph.nodes(data=True):
            name = data.get('name', '').lower()
            if any(term in name for term in query_terms):
                relevant_nodes.append(node)
        
        results = []
        for node in relevant_nodes:
            node_data = self.graph.nodes[node]
            context = {"entity": node_data, "connections": []}
            for neighbor in self.graph.successors(node):
                edge_data = self.graph.get_edge_data(node, neighbor)
                neighbor_data = self.graph.nodes[neighbor]
                context["connections"].append({"relation": edge_data["relation"], "target": neighbor_data})
            for predecessor in self.graph.predecessors(node):
                edge_data = self.graph.get_edge_data(predecessor, node)
                pred_data = self.graph.nodes[predecessor]
                context["connections"].append({"relation": f"Is {edge_data['relation']} By", "source": pred_data})
            results.append(context)
        return results

    def get_stats(self):
        if self.use_neo4j:
            with self.driver.session() as session:
                nodes = session.run("MATCH (n) RETURN count(n) AS c").single()['c']
                edges = session.run("MATCH ()-[r]->() RETURN count(r) AS c").single()['c']
                return {
                    "nodes": nodes,
                    "edges": edges,
                    "engine": "Neo4j Enterprise Edition"
                }
        else:
            return {
                "nodes": self.graph.number_of_nodes(),
                "edges": self.graph.number_of_edges(),
                "engine": "NetworkX In-Memory (Fallback)"
            }
