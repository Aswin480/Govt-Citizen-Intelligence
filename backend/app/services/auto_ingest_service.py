import os
import time
from sqlalchemy.orm import Session
from app.services.scraper_service import ingest_sample_debate

# Determine absolute paths for robustness
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
WATCH_FOLDER = os.path.join(BASE_DIR, "data", "incoming")
PROCESSED_LOG = os.path.join(BASE_DIR, "data", "processed_files.txt")

def load_processed_files():
    if not os.path.exists(PROCESSED_LOG):
        return set()
    with open(PROCESSED_LOG, "r") as f:
        return set(line.strip() for line in f.readlines())

def mark_as_processed(filename: str):
    with open(PROCESSED_LOG, "a") as f:
        f.write(filename + "\n")

def watch_and_ingest(db: Session, poll_interval: int = 10):
    """
    Watches incoming folder and ingests new transcript files automatically.
    """
    print(f"[AUTO-INGEST] Watcher Started on: {WATCH_FOLDER}")
    
    # Ensure folder exists
    os.makedirs(WATCH_FOLDER, exist_ok=True)

    processed_files = load_processed_files()

    while True:
        try:
            for filename in os.listdir(WATCH_FOLDER):
                if not filename.endswith(".html"):
                    continue

                if filename in processed_files:
                    continue

                print(f"[AUTO-INGEST] Detected new file: {filename}")
                file_path = os.path.join(WATCH_FOLDER, filename)

                # Run ingestion
                try:
                    print(f"[REAL-TIME] Timestamp: {time.strftime('%H:%M:%S')} | Detected Publication: {filename}")
                    
                    # 1. Ingest Raw Data (Engine 1.0)
                    count = ingest_sample_debate(file_path, db)
                    print(f"[AUTO-INGEST] Ingested {count} speeches from {filename}")
                    
                    # 2. Holographic Linking (Engine 2.0)
                    # We need the text content for resolution. Usually ingest_sample_debate saves to DB.
                    # For demo, let's read the file content again or hook into the db model stream.
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()[:5000] # First 5k chars for header resolution
                        
                    from app.services.holographic_resolver import HolographicResolver
                    import networkx as nx
                    
                    # Initialize resolver with dummy graph for now (or load real one)
                    resolver = HolographicResolver(db, nx.DiGraph()) 
                    links = resolver.link_content_to_graph(filename, "DebateTranscript", content)
                    
                    if links:
                        print(f"🔗 [ENGINE 2.0] HOLOGRAPHIC LINKS DETECTED: {len(links)}")
                        for link in links[:3]:
                            print(f"   ↳ Linked '{filename}' -> {link['target_type']}:{link['target_id']}")
                    
                    mark_as_processed(filename)
                    processed_files.add(filename)
                except Exception as e:
                    print(f"[AUTO-INGEST] Failed to ingest {filename}: {e}")

            time.sleep(poll_interval)
        except Exception as e:
            print(f"[AUTO-INGEST] Watcher Loop Error: {e}")
            time.sleep(poll_interval)
