import requests
from bs4 import BeautifulSoup
import pandas as pd
import json
import re
import os

URL = "https://en.wikipedia.org/wiki/List_of_members_of_the_18th_Lok_Sabha"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

def clean_text(text):
    if not text: return ""
    text = re.sub(r'\[.*?\]', '', text).strip()
    return text

def scrape_lok_sabha():
    print(f"Fetching {URL}...")
    try:
        response = requests.get(URL, headers=HEADERS)
        response.raise_for_status()
    except Exception as e:
        print(f"Failed to fetch URL: {e}")
        return

    soup = BeautifulSoup(response.text, 'html.parser')
    tables = soup.find_all('table', class_='wikitable')
    
    # The Lok Sabha page usually has one big table or state-wise tables.
    # For 18th LS, it's often state-wise tables.
    # We need to iterate all tables and look for "Constituency", "Member", "Party" headers.
    
    all_members = []
    
    print(f"Found {len(tables)} tables. Scanning for member lists...")

    for table in tables:
        headers = [th.get_text(strip=True).lower() for th in table.find_all('th')]
        
        # Check if this table looks like a member list
        if any("constituency" in h for h in headers) and any("party" in h for h in headers):
            rows = table.find_all('tr')[1:] # Skip header
            
            for tr in rows:
                tds = tr.find_all(['td', 'th'])
                cleaned_tds = [clean_text(td.get_text()) for td in tds]
                
                # Standard format typically: No | Constituency | Name | Party | Remarks
                # Sometimes: Constituency | Reserved | Member | Party ...
                
                # Let's try to map dynamically or use heuristics
                # 18th LS wiki format is usually:
                # Constituency | Name | Party | Alliance | Remarks
                
                if len(cleaned_tds) >= 3:
                     # Heuristic: Party is usually the one with a link or just text
                     # Let's find columns that likely hold Name and Party
                     
                     # Check for Constituency (usually col 0 or 1)
                     constituency = "Unknown"
                     member_name = "Unknown"
                     party = "Unknown"
                     
                     # Simple parsing based on common wiki structure for this specific page
                     # (This might need adjustment if wiki format changes, but usually stable)
                     
                     # Attempt 1: 5 columns: [No, Constituency, Reserved, Member, Party] -> AP style
                     # Attempt 2: 4 columns: [Constituency, Member, Party, Remarks]
                     
                     if len(cleaned_tds) >= 4 and "constituency" in headers[0]:
                         constituency = cleaned_tds[0]
                         member_name = cleaned_tds[1]
                         party = cleaned_tds[2]
                     elif len(cleaned_tds) >= 5 and cleaned_tds[0].isdigit():
                         constituency = cleaned_tds[1]
                         member_name = cleaned_tds[3] # Skipping Reserved?
                         party = cleaned_tds[4]
                     else:
                        # Fallback: grab first 3
                        constituency = cleaned_tds[0]
                        member_name = cleaned_tds[1]
                        party = cleaned_tds[2]

                     # Refine Party Colors
                     bg_color = "#94a3b8"
                     p_lower = party.lower()
                     if "bjp" in p_lower or "bharatiya janata" in p_lower: bg_color = "#FF9933"
                     elif "inc" in p_lower or "congress" in p_lower: bg_color = "#00BFFF"
                     elif "dmk" in p_lower: bg_color = "#DD1100"
                     elif "tmc" in p_lower or "trinamool" in p_lower: bg_color = "#228B22"
                     elif "samajwadi" in p_lower or "sp" in p_lower: bg_color = "#EF4444"
                     elif "tdp" in p_lower: bg_color = "#F9D929"
                     elif "shiv sena" in p_lower: bg_color = "#F97316"
                     elif "aap" in p_lower: bg_color = "#0072B0"

                     if member_name and party:
                        all_members.append({
                            "house": "lok_sabha",
                            "name": member_name,
                            "constituency": constituency,
                            "party": party,
                            "color": bg_color,
                            "role": "MP" 
                        })

    print(f"Scraped {len(all_members)} MPs (Target: ~543).")
    
    # Deduplicate by constituency just in case
    # Convert to DF for easy handling
    df = pd.DataFrame(all_members)
    df = df.drop_duplicates(subset=['constituency', 'name'])
    
    final_data = df.to_dict(orient='records')
    print(f"Final Count: {len(final_data)}")

    # Save
    json_path = "lok_sabha_2024.json"
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(final_data, f, indent=2)
    print(f"Saved local: {json_path}")

    # Copy to Frontend
    frontend_data_dir = os.path.abspath(os.path.join(os.getcwd(), '..', 'frontend-citizen', 'src', 'data'))
    if not os.path.exists(frontend_data_dir):
        os.makedirs(frontend_data_dir)
    
    frontend_path = os.path.join(frontend_data_dir, 'lok_sabha_2024.json')
    with open(frontend_path, 'w', encoding='utf-8') as f:
        json.dump(final_data, f, indent=2)
    print(f"Copied to Frontend: {frontend_path}")

if __name__ == "__main__":
    scrape_lok_sabha()
