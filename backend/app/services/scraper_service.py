from bs4 import BeautifulSoup
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.debate import RawDebate
from app.services.extractor_engine import EliteScraperEngine
import os
import json

# --- DYNAMIC CONFIGURATION (Could be in DB) ---
DYNAMIC_SOURCES = [
    {"url": "https://loksabha.nic.in/", "schema": "parliament updates, notices, latest bills"},
    {"url": "https://sansad.in/rs", "schema": "rajya sabha business, debates, bulletins"}
]

def ingest_sample_debate(html_path: str, db: Session):
    """
    Parses an HTML transcript and saves it to the Debate table.
    """
    # 1. Check if file exists
    if not os.path.exists(html_path):
        raise FileNotFoundError(f"Debate file not found at: {html_path}")

    # 2. Read the file
    with open(html_path, "r", encoding="utf-8") as file:
        soup = BeautifulSoup(file, "html.parser")

    # 3. Extract Metadata
    try:
        date_str = soup.find("span", class_="date").text.strip()
        debate_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except:
        debate_date = datetime.now().date()

    # 4. Extract Speeches
    speeches = soup.find_all("div", class_="speech")
    
    count = 0
    for speech in speeches:
        speaker_name = speech.find("span", class_="speaker").text.strip()
        party_name = speech.find("span", class_="party").text.strip()
        text_content = speech.find("p", class_="text").text.strip()

        # 5. Save to Database
        new_debate = RawDebate(
            date=debate_date,
            speaker=speaker_name,
            party=party_name,
            text=text_content,
            house="Lok Sabha",       
            session="Monsoon 2025", 
            language="en"
        )
        
        db.add(new_debate)
        count += 1

    db.commit()
    return count

def run_admin_scraping_job(custom_config=None):
    """
    Called by Admin to run a specific or all scraping jobs.
    Uses the EliteScraperEngine for robust extraction.
    """
    engine = EliteScraperEngine()
    results = []
    
    targets = [custom_config] if custom_config else DYNAMIC_SOURCES
    
    for config in targets:
        print(f"🚀 Starting Extraction for: {config['url']}")
        result = engine.run_dynamic({
            "url": config['url'],
            "target_schema": config.get("schema", "key political data"),
            "force_ai": True # Use AI for 100/100 accuracy on unstructured headers
        })
        
        if result['status'] == 'success':
            results.append(result)
            print(f"✅ Success: Found {len(result['datasets'])} datasets")
        else:
            print(f"❌ Failed: {result.get('message')}")
            
    return results

def scrape_latest_debates():
    """
    Scheduled task that runs the dynamic scraper.
    """
    print("⏰ Cron Triggered: Running Elite Scraper...")
    return run_admin_scraping_job()
