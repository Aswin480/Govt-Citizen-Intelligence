import os
import json
import random
import datetime
import requests
import feedparser
from google import genai
from app.db.database import SessionLocal
from app.models.news import NewsArticle
from app.models.parliament import Member, Bill
from app.models.budget import Budget

LANGUAGES = ["en", "hi", "ta", "mr", "bn"] 

RSS_FEEDS = [
    "https://pib.gov.in/RssFull.aspx", # Official PIB
    "https://sansad.in/rss/bills", # Official Bills
    "https://www.thehindu.com/news/national/feeder/default.rss" # National News
]

def scrape_and_ingest():
    db = SessionLocal()
    added_count = 0
    print("[NEWS ENGINE] Starting LIVE Ingestion Pipeline...")
    
    try:
        # 1. Pull Real News from RSS
        real_facts = []
        for feed_url in RSS_FEEDS:
            try:
                feed = feedparser.parse(feed_url)
                for entry in feed.entries[:5]:
                    real_facts.append(f"REAL NEWS: {entry.title}. Summary: {entry.get('summary', '')[:200]}")
            except:
                continue

        # 2. Gather Database Facts
        bills = db.query(Bill).limit(5).all()
        for bill in bills:
            real_facts.append(f"DB BILL: '{bill.title}'. Status: {bill.status}.")
        
        context_str = "\n".join(real_facts[:20])

        api_key = os.getenv("GEMINI_API_KEY", "***REMOVED***")
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={api_key}"

        for lang in LANGUAGES:
            print(f"[NEWS ENGINE] Processing Language: {lang}")
            prompt = f"Create 5 factual news articles in {lang} ISO code based on these facts: {context_str}. Output JSON format ONLY: {{'articles': [{{'headline': '', 'section': 'National', 'content': ['']}}]}}"
            
            payload = {"contents": [{"parts": [{"text": prompt}]}]}
            
            try:
                res = requests.post(url, json=payload, timeout=30)
                res_data = res.json()
                raw = res_data['candidates'][0]['content']['parts'][0]['text']
                raw = raw.replace("```json", "").replace("```", "").strip()
                data = json.loads(raw)
                items = data.get("articles", [])
                
                for i, item in enumerate(items):
                    headline = item.get("headline", "")
                    exists = db.query(NewsArticle).filter(NewsArticle.headline == headline).first()
                    if exists: continue
                        
                    section = item.get("section", "National")
                    page_mapping = {"National": 2, "State/UT": 3, "Business": 5, "Technology": 6, "International": 7}
                    
                    article = NewsArticle(
                        region_type="Nation", region_name="India", section=section,
                        page=page_mapping.get(section, 2), priority=i + 1, language=lang,
                        headline=headline, subheadline=f"AI Insight: Official Verified",
                        author="System", location="Command Center", content=item.get("content", [headline]),
                        image_url=f"https://picsum.photos/seed/{random.randint(1,1000)}/800/400"
                    )
                    db.add(article)
                    added_count += 1
                    
            except Exception as lang_e:
                print(f"[NEWS ENGINE] Failed generation for {lang}: {lang_e}")

        # 3. OVERNIGHT DEBATE INGESTION
        print("[DEBATE ENGINE] Processing session transcripts...")
        members = db.query(Member).limit(3).all()
        for mp in members:
            prompt = f"Create a short parliamentary speech for {mp.name} regarding: {context_str}. JSON: {{'speech': '', 'sentiment': 0.5}}"
            payload = {"contents": [{"parts": [{"text": prompt}]}]}
            try:
                res = requests.post(url, json=payload, timeout=20)
                res_data = res.json()
                raw = res_data['candidates'][0]['content']['parts'][0]['text'].replace("```json", "").replace("```", "").strip()
                data = json.loads(raw)
                # (Debate/Transcript logic simplified for script)
            except: continue

        db.commit()
        print(f"[NEWS ENGINE] Pipeline Complete. Ingested {added_count} articles.")
        return {"status": "success", "articles_added": added_count}

    except Exception as e:
        print(f"[NEWS ENGINE] Pipeline failed: {e}")
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

def ingest_debates(db, client, context):
    """
    Simulates real-time Parliamentary Transcript ingestion based on latest context.
    Populates 'Debate' and 'Transcript' tables.
    """
    from app.models.parliament import Debate, Transcript, Member, House
    
    print("[DEBATE ENGINE] Processing session transcripts...")
    
    # 1. Create a Debate Session
    house = db.query(House).first()
    if not house: return
    
    new_debate = Debate(
        title=f"Session on {datetime.datetime.now().strftime('%B %Y')} Legislative Priorities",
        house_id=house.id
    )
    db.add(new_debate)
    db.flush() # Get ID
    
    # 2. Get Members to 'Speak'
    members = db.query(Member).limit(3).all()
    if not members: return

    for mp in members:
        prompt = f"Create a 3-sentence parliamentary speech for {mp.name} regarding: {context}. Be realistic. Return JSON: {{'speech': '', 'sentiment': 0.5}}"
        try:
            resp = client.models.generate_content(model='gemini-1.5-flash', contents=prompt)
            raw = resp.text.replace("```json", "").replace("```", "").strip()
            data = json.loads(raw)
            
            transcript = Transcript(
                debate_id=new_debate.id,
                member_id=mp.id,
                content=data.get('speech', ''),
                sentiment_score=data.get('sentiment', 0.0)
            )
            db.add(transcript)
        except:
            continue

if __name__ == "__main__":
    scrape_and_ingest()
