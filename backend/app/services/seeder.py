import sys
import os

# Ensure backend directory is in python path if run directly
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(BASE_DIR)

from sqlalchemy import text
from app.db.database import SessionLocal, engine
from app.db.base import Base
from app.models.parliament import House
from app.models.scraper_job import ScraperJob

def seed_data():
    # Create tables first (just in case)
    Base.metadata.create_all(bind=engine)

    session = SessionLocal()
    try:
        # Check if data exists
        result = session.execute(text("SELECT count(*) FROM houses"))
        count = result.scalar()
        if count == 0:
            print("Seeding Houses...")
            houses = [
                House(
                    name="Lok Sabha",
                    type="National",
                    state="India",
                    video_stream_url="https://www.youtube.com/embed/2Uj1aOLG4_k"  # Sansad TV Lok Sabha
                ),
                House(
                    name="Rajya Sabha",
                    type="National",
                    state="India",
                    video_stream_url="https://www.youtube.com/embed/2Uj1aOLG4_k"  # Sansad TV Rajya Sabha
                ),
                House(
                    name="Kerala Legislative Assembly",
                    type="State",
                    state="Kerala",
                    video_stream_url="https://www.youtube.com/embed/live_stream_id" # Placeholder
                ),
                 House(
                    name="Uttar Pradesh Legislative Assembly",
                    type="State",
                    state="Uttar Pradesh",
                    video_stream_url="https://www.youtube.com/embed/live_stream_id" # Placeholder
                )
            ]
            session.add_all(houses)
            session.commit()
            print("Seeded Houses successfully.")
        else:
            print("Houses already seeded. Skipping.")

        # --- SEED SCRAPER JOBS (ELITE ENGINE TARGETS) ---
        print("Seeding Elite Scraper Jobs...")
        jobs = [
            # 1. STATES & UTs
            {
                "url": "https://www.india.gov.in/my-government/state-ut-governments",
                "name": "All State Portals Directory",
                "frequency_seconds": 604800, # Weekly
                "schema_prompt": "List of State Names, Capital, Governor, Chief Minister, Official Website URL",
                "force_ai": True
            },
            # 2. MLA / Assembly Composition
            {
                "url": "https://results.eci.gov.in",
                "name": "Election Commission Results",
                "frequency_seconds": 86400, # Daily
                "schema_prompt": "Assembly Constituency Results, Winning Party, Candidate Name, Margin",
                "force_ai": True
            },
            # 3. MPs, Bills (Lok Sabha)
            {
                "url": "https://sansad.in/ls/members",
                "name": "Lok Sabha Member Directory",
                "frequency_seconds": 21600, # 6 Hours
                "schema_prompt": "MP Name, Constituency, State, Party, Email",
                "force_ai": True
            },
            # 3. MPs, Bills (Rajya Sabha)
            {
                "url": "https://sansad.in/rs/members",
                "name": "Rajya Sabha Member Directory",
                "frequency_seconds": 21600, # 6 Hours
                "schema_prompt": "MP Name, State, Party, Term End Date",
                "force_ai": True
            },
             # 4. UNION BUDGET
            {
                "url": "https://www.indiabudget.gov.in",
                "name": "Union Budget Documents",
                "frequency_seconds": 86400, # Daily
                "schema_prompt": "Budget Highlights, Sector Allocations, Fiscal Deficit Data",
                "force_ai": True
            },
            # 5. SCHEMES
            {
                "url": "https://www.myscheme.gov.in",
                "name": "Central Government Schemes",
                "frequency_seconds": 604800, # Weekly
                "schema_prompt": "Scheme Name, Ministry, Benefits, Eligibility Criteria",
                "force_ai": True
            },
            # 6. NEWS (Real-Time)
            {
                "url": "https://pib.gov.in",
                "name": "Press Information Bureau (PIB)",
                "frequency_seconds": 3600, # Hourly
                "schema_prompt": "Press Release Headline, Ministry, Date, Summary",
                "force_ai": False # HTML Text is usually clean
            },
             # 7. OPEN DATA
            {
                "url": "https://data.gov.in",
                "name": "Open Government Data Catalogs",
                "frequency_seconds": 604800, 
                "schema_prompt": "Dataset Title, Sector, Format (CSV/API), Last Updated",
                "force_ai": True
            },
             # 8. LAWS
            {
                "url": "https://www.indiacode.nic.in",
                "name": "India Code (Central Acts)",
                "frequency_seconds": 2592000, # Monthly
                "schema_prompt": "Act Name, Year, Act ID, Status",
                "force_ai": False
            },
            # 9. AI FACT CHECKER
            {
                "url": "https://pib.gov.in/Factcheck.aspx",
                "name": "Govt Fake News Buster",
                "frequency_seconds": 43200, # 12 Hours
                "schema_prompt": "Fact Check Title, Viral Claim, Truth, Source Link",
                "force_ai": True
            },
            # 10. LEGAL COMPLIANCE
            {
                "url": "https://main.sci.gov.in/judgments",
                "name": "Supreme Court Judgments",
                "frequency_seconds": 86400, # Daily
                "schema_prompt": "Case Title, Judgment Date, Bench, PDF Link",
                "force_ai": True
            }
        ]

        for job_data in jobs:
            exists = session.query(ScraperJob).filter_by(url=job_data["url"]).first()
            if not exists:
                new_job = ScraperJob(**job_data)
                session.add(new_job)
                print(f"  + Added Job: {job_data['name']}")
            else:
                print(f"  . Skipped (Exists): {job_data['name']}")
        
        session.commit()
        print("✅ Elite Scraper Jobs Seeded Successfully.")

    except Exception as e:
        print(f"Error seeding data: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    seed_data()
