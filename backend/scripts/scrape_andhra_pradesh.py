import requests
from bs4 import BeautifulSoup
import pandas as pd
import json
import re
import os

URL = "https://en.wikipedia.org/wiki/List_of_constituencies_of_the_Andhra_Pradesh_Legislative_Assembly"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

def clean_text(text):
    if not text: return ""
    text = re.sub(r'\[.*?\]', '', text).strip()
    return text

def scrape_wiki():
    print(f"Fetching {URL}...")
    try:
        response = requests.get(URL, headers=HEADERS)
        response.raise_for_status()
    except Exception as e:
        print(f"Failed to fetch URL: {e}")
        return

    soup = BeautifulSoup(response.text, 'html.parser')
    tables = soup.find_all('table', class_='wikitable')
    
    # Heuristic: Find table with > 150 rows (Assembly has 175 seats)
    target_table = None
    for table in tables:
        rows = table.find_all('tr')
        if len(rows) > 150:
            target_table = table
            print(f"Found table with {len(rows)} rows. Assuming this is the MLA list.")
            break
            
    if not target_table:
        print("Could not find any table with > 150 rows.")
        return

    print("Parsing table...")
    
    data = []
    tr_elements = target_table.find_all('tr')[1:] # Skip header
    
    for tr in tr_elements:
        tds = tr.find_all(['td', 'th'])
        cleaned_tds = [clean_text(td.get_text()) for td in tds]
        
        # Valid row check (should have at least 6 columns)
        # 0: No
        # 1: Name
        # 2: Reserved
        # 3: District
        # 4: Member
        # 5: Party
        
        if len(cleaned_tds) >= 6 and cleaned_tds[0].isdigit():
            
            party = cleaned_tds[5]
            bg_color = "#94a3b8" # Default Slate

            # Simple Color Mapping
            p_lower = party.lower()
            if "ysr" in p_lower: 
                party = "YSRCP"
                bg_color = "#14438d"
            elif "telugu desam" in p_lower or "tdp" in p_lower: 
                party = "TDP"
                bg_color = "#F9D929" # Yellow
            elif "janaseña" in p_lower or "janasena" in p_lower or "jsp" in p_lower: 
                party = "Janasena"
                bg_color = "#D71B1E" # Red
            elif "bharatiya" in p_lower or "bjp" in p_lower: 
                party = "BJP"
                bg_color = "#FF9933" # Saffron

            data.append({
                "id": cleaned_tds[0],
                "constituency": cleaned_tds[1],
                "district": cleaned_tds[3],
                "member": cleaned_tds[4],
                "party": party,
                "color": bg_color
            })

    print(f"Scraped {len(data)} valid member rows.")
    
    # Save to Backend
    json_path = "andhra_pradesh_assembly_2026.json"
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
    print(f"Saved local: {json_path}")
    
    # Copy to Frontend
    frontend_data_dir = os.path.abspath(os.path.join(os.getcwd(), '..', 'frontend-citizen', 'src', 'data'))
    if not os.path.exists(frontend_data_dir):
        os.makedirs(frontend_data_dir)
        
    frontend_path = os.path.join(frontend_data_dir, 'andhra_pradesh_assembly_2026.json')
    with open(frontend_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
    print(f"Copied to Frontend: {frontend_path}")

if __name__ == "__main__":
    scrape_wiki()
