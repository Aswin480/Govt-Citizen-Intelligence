import requests
from bs4 import BeautifulSoup
import json
import re
import os

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

def clean_text(text):
    if not text: return ""
    text = re.sub(r'\[.*?\]', '', text).strip()
    return text

def scrape_rajya_sabha():
    url = "https://en.wikipedia.org/wiki/List_of_current_members_of_the_Rajya_Sabha"
    print(f"Fetching: {url}")
    
    try:
        r = requests.get(url, headers=HEADERS)
        r.raise_for_status()
    except Exception as e:
        print(f"Error: {e}")
        return []

    soup = BeautifulSoup(r.text, 'html.parser')
    
    # The page usually has multiple tables (Alphabetical or by State). 
    # Or one big sortable table. Let's look for "Member" and "Party" headers.
    
    tables = soup.find_all('table', class_='wikitable')
    members = []
    
    for table in tables:
        headers = [th.get_text(strip=True).lower() for th in table.find_all('th')]
        
        # We need tables that likely contain member lists
        # Usually headers: [State, Name, Party, ...] or [Name, Party, State, ...]
        
        name_idx = -1
        party_idx = -1
        state_idx = -1
        
        for i, h in enumerate(headers):
            if "member" in h or "name" in h: name_idx = i
            if "party" in h: party_idx = i
            if "state" in h: state_idx = i
            
        if name_idx != -1 and party_idx != -1:
            # Good table
            rows = table.find_all('tr')[1:]
            for tr in rows:
                cols = tr.find_all(['td', 'th'])
                # Some tables use 'th' for the name column too
                
                # Handling rowspan is tricky in simple scraping, but often Wikipedia repeats or we can assume previous
                # For simplicity, if cols count matches headers approx
                
                if len(cols) >= max(name_idx, party_idx):
                    try:
                        name_cell = cols[name_idx]
                        party_cell = cols[party_idx]
                        
                        name = clean_text(name_cell.get_text())
                        party = clean_text(party_cell.get_text())
                        state = "N/A"
                        if state_idx != -1 and len(cols) > state_idx:
                            state = clean_text(cols[state_idx].get_text())
                        
                        # Sometimes State is in a previous 'th' with rowspan (e.g. state-wise list)
                        # Ignoring that complexity for now, focusing on Name/Party which is critical
                        
                        if len(name) > 2 and name != "Vacant":
                            members.append({
                                "name": name,
                                "party": party,
                                "constituency": state, # reusing field
                                "house": "rajya_sabha",
                                "role": "MP",
                                "image": "" # images are harder in list views
                            })
                    except:
                        continue
                        
    # Dedupe
    unique = {m['name']: m for m in members}
    print(f"Found {len(unique)} unique members")
    return list(unique.values())

def main():
    data = scrape_rajya_sabha()
    
    # Save Backend
    json_path = "rajya_sabha_2026.json"
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
        
    # Copy to Frontend
    frontend_dir = os.path.abspath(os.path.join(os.getcwd(), '..', 'frontend-citizen', 'src', 'data'))
    if not os.path.exists(frontend_dir):
        os.makedirs(frontend_dir)
        
    frontend_path = os.path.join(frontend_dir, 'rajya_sabha_2026.json')
    with open(frontend_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)

    print(f"Saved to {frontend_path}")

if __name__ == "__main__":
    main()
