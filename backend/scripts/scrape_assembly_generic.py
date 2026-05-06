import requests
from bs4 import BeautifulSoup
import json
import re
import os
import argparse
import urllib.parse
import sys

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

STATE_CONFIGS = {
    # 28 STATES
    "andhra-pradesh": {"url": "https://en.wikipedia.org/wiki/List_of_members_of_the_16th_Andhra_Pradesh_Legislative_Assembly"},
    "arunachal-pradesh": {"url": "https://en.wikipedia.org/wiki/List_of_members_of_the_8th_Arunachal_Pradesh_Legislative_Assembly"},
    "assam": {"url": "https://en.wikipedia.org/wiki/List_of_members_of_the_15th_Assam_Legislative_Assembly"},
    "bihar": {"url": "https://en.wikipedia.org/wiki/List_of_members_of_the_17th_Bihar_Legislative_Assembly"},
    "chhattisgarh": {"url": "https://en.wikipedia.org/wiki/List_of_members_of_the_6th_Chhattisgarh_Legislative_Assembly"},
    "goa": {"url": "https://en.wikipedia.org/wiki/List_of_members_of_the_8th_Goa_Legislative_Assembly"},
    "gujarat": {"url": "https://en.wikipedia.org/wiki/List_of_members_of_the_15th_Gujarat_Legislative_Assembly"},
    "haryana": {"url": "https://en.wikipedia.org/wiki/List_of_members_of_the_15th_Haryana_Legislative_Assembly"},
    "himachal-pradesh": {"url": "https://en.wikipedia.org/wiki/List_of_members_of_the_14th_Himachal_Pradesh_Legislative_Assembly"},
    "jharkhand": {"url": "https://en.wikipedia.org/wiki/List_of_members_of_the_5th_Jharkhand_Legislative_Assembly"},
    "karnataka": {"url": "https://en.wikipedia.org/wiki/List_of_members_of_the_16th_Karnataka_Legislative_Assembly"},
    "kerala": {"url": "https://en.wikipedia.org/wiki/List_of_members_of_the_15th_Kerala_Legislative_Assembly"},
    "madhya-pradesh": {"url": "https://en.wikipedia.org/wiki/List_of_members_of_the_16th_Madhya_Pradesh_Legislative_Assembly"},
    "maharashtra": {"url": "https://en.wikipedia.org/wiki/List_of_members_of_the_15th_Maharashtra_Legislative_Assembly"},
    "manipur": {"url": "https://en.wikipedia.org/wiki/List_of_members_of_the_12th_Manipur_Legislative_Assembly"},
    "meghalaya": {"url": "https://en.wikipedia.org/wiki/List_of_members_of_the_11th_Meghalaya_Legislative_Assembly"},
    "mizoram": {"url": "https://en.wikipedia.org/wiki/List_of_members_of_the_9th_Mizoram_Legislative_Assembly"},
    "nagaland": {"url": "https://en.wikipedia.org/wiki/List_of_members_of_the_14th_Nagaland_Legislative_Assembly"},
    "odisha": {"url": "https://en.wikipedia.org/wiki/List_of_members_of_the_17th_Odisha_Legislative_Assembly"},
    "punjab": {"url": "https://en.wikipedia.org/wiki/List_of_members_of_the_16th_Punjab_Legislative_Assembly"},
    "rajasthan": {"url": "https://en.wikipedia.org/wiki/List_of_members_of_the_16th_Rajasthan_Legislative_Assembly"},
    "sikkim": {"url": "https://en.wikipedia.org/wiki/List_of_members_of_the_11th_Sikkim_Legislative_Assembly"},
    "tamil-nadu": {"url": "https://en.wikipedia.org/wiki/List_of_members_of_the_16th_Tamil_Nadu_Legislative_Assembly"},
    "telangana": {"url": "https://en.wikipedia.org/wiki/2023_Telangana_Legislative_Assembly_election"},
    "tripura": {"url": "https://en.wikipedia.org/wiki/List_of_members_of_the_13th_Tripura_Legislative_Assembly"},
    "uttar-pradesh": {"url": "https://en.wikipedia.org/wiki/List_of_members_of_the_18th_Uttar_Pradesh_Legislative_Assembly"},
    "uttarakhand": {"url": "https://en.wikipedia.org/wiki/List_of_members_of_the_5th_Uttarakhand_Legislative_Assembly"},
    "west-bengal": {"url": "https://en.wikipedia.org/wiki/List_of_members_of_the_17th_West_Bengal_Legislative_Assembly"},
    
    # Union Territories with Assemblies
    "delhi": {"url": "https://en.wikipedia.org/wiki/List_of_members_of_the_7th_Delhi_Legislative_Assembly"},
    "jammu-and-kashmir": {"url": "https://en.wikipedia.org/wiki/List_of_members_of_the_Jammu_and_Kashmir_Legislative_Assembly"}, 
    "puducherry": {"url": "https://en.wikipedia.org/wiki/List_of_members_of_the_15th_Puducherry_Legislative_Assembly"},
    
    # Other UTs (No Assembly, but config present to prevent crash)
    "andaman-and-nicobar-islands": {"url": ""},
    "chandigarh": {"url": ""},
    "dadra-and-nagar-haveli-and-daman-and-diu": {"url": ""},
    "ladakh": {"url": ""},
    "lakshadweep": {"url": ""}
}

KNOWN_PARTIES = ["INC", "INC+", "BJP", "BRS", "TRS", "AIMIM", "CPI", "CPM", "TDP", "YSRCP", "JSP", "SHS", "NCP", "SP", "BSP", "RJD", "JD(U)", "DMK", "AIADMK", "AITC", "TMC", "AAP"]

def clean_text(text):
    if not text: return ""
    text = re.sub(r'\[.*?\]', '', text).strip()
    return text

def scrape_leadership(state_key):
    return {
        "chief_minister": {"name": "Revanth Reddy", "role": "Chief Minister", "image": "https://ui-avatars.com/api/?name=Revanth+Reddy"},
        "governor": {"name": "Jishnu Dev Varma", "role": "Governor", "image": "https://ui-avatars.com/api/?name=Jishnu+Dev+Varma"}
    }

def scrape_assembly_members(state_key):
    config = STATE_CONFIGS.get(state_key)
    if not config: return []
    url = config['url']
    
    print(f"Fetching: {url}") # Print to stdout for tool to catch if simple
    
    with open("debug_scraper.log", "w", encoding="utf-8") as log:
        log.write(f"Fetching: {url}\n")
        
        try:
            r = requests.get(url, headers=HEADERS)
            r.raise_for_status()
        except Exception as e:
            log.write(f"Error: {e}\n")
            return []
            
        soup = BeautifulSoup(r.text, 'html.parser')
        tables = soup.find_all('table', class_='wikitable')
        log.write(f"Found {len(tables)} tables\n")
        
        members = []
        
        for idx, table in enumerate(tables):
            rows = table.find_all('tr')
            log.write(f"Table {idx}: {len(rows)} rows\n")
            
            for row_i, tr in enumerate(rows):
                # Using get_text separator to prevent merging
                cols = [td.get_text(strip=True) for td in tr.find_all(['td', 'th'])]
                
                if not cols: continue
                
                # Heuristic: Find first Party
                winner_idx = -1
                for i, val in enumerate(cols):
                    clean_val = re.sub(r'\[.*?\]', '', val).strip().upper()
                    
                    if clean_val in KNOWN_PARTIES:
                        winner_idx = i
                        break
                
                if winner_idx != -1:
                    try:
                        party = clean_text(cols[winner_idx])
                        
                        # Look back logic
                        name_idx = winner_idx - 1
                        if name_idx >= 0 and (len(clean_text(cols[name_idx])) < 3 or clean_text(cols[name_idx]) == ""):
                            name_idx = winner_idx - 2
                        
                        if name_idx < 0: continue
                        name = clean_text(cols[name_idx])
                        
                        constituency = "Unknown"
                        # Try to find constituency at name_idx - 1 (Const Name) or name_idx - 2 (Const No)
                        const_name_idx = name_idx - 1
                        
                        # If const_name_idx is a number, jump back
                        if const_name_idx >= 0 and clean_text(cols[const_name_idx]).isdigit():
                            const_name_idx -= 1
                            
                        if const_name_idx >= 0:
                            constituency = clean_text(cols[const_name_idx])

                        # Validation
                        if len(name) > 3 and "Candidate" not in name and "Winner" not in name:
                             # Exclude rows where "Party" is also the Name (header row edge case)
                             if name.upper() in KNOWN_PARTIES: continue

                             constituency = re.sub(r'\(.*?\)', '', constituency).strip()
                             
                             members.append({
                                 "name": name,
                                 "party": party,
                                 "constituency": constituency,
                                 "image": f"https://ui-avatars.com/api/?name={urllib.parse.quote(name)}&background=random",
                                 "pk": f"{state_key}-{constituency}-{name}"
                             })
                    except Exception as e:
                        log.write(f"  Err parsing row {row_i}: {e}\n")
                        pass

    # Dedupe
    unique = list({m['pk']: m for m in members}.values())
    print(f"Total Unique Members: {len(unique)}")
    return unique

def main():
    if len(sys.argv) < 2:
        state_key = "telangana"
    else:
        state_key = sys.argv[1].lower()
    
    print(f"=== Scraping {state_key.upper()} ===")
    
    leadership = scrape_leadership(state_key)
    members = scrape_assembly_members(state_key)
    
    result = {
        "state": state_key,
        "leadership": leadership,
        "members": members,
        "total_seats": len(members),
        "source": STATE_CONFIGS.get(state_key, {}).get('url', ''),
        "last_updated": "2026-01-18"
    }
    
    # Save
    json_path = f"state_{state_key}_2026.json"
    frontend_dir = os.path.abspath(os.path.join(os.getcwd(), '..', 'frontend-citizen', 'src', 'data', 'states'))
    
    if not os.path.exists(frontend_dir):
        os.makedirs(frontend_dir)
        
    frontend_path = os.path.join(frontend_dir, json_path)
    
    with open(frontend_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2)
        
    print(f"Saved {len(members)} members to {frontend_path}")

if __name__ == "__main__":
    main()
