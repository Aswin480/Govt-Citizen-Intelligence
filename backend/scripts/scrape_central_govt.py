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

def scrape_infobox_image(soup):
    # Try to find the main image in the infobox
    try:
        infobox = soup.find('table', class_='infobox')
        if infobox:
            img = infobox.find('img')
            if img:
                src = img.get('src')
                if src.startswith('//'):
                    return "https:" + src
                return src
    except:
        pass
    return "https://via.placeholder.com/150"

def fetch_details(url):
    try:
        r = requests.get(url, headers=HEADERS)
        if r.status_code == 200:
            soup = BeautifulSoup(r.text, 'html.parser')
            # Get Image
            image = scrape_infobox_image(soup)
            return image
    except:
        pass
    return None

def scrape_council_ministers():
    url = "https://en.wikipedia.org/wiki/Third_Modi_ministry"
    print(f"Fetching Ministry: {url}")
    
    try:
        r = requests.get(url, headers=HEADERS)
        r.raise_for_status()
    except Exception as e:
        print(f"Error: {e}")
        return []

    soup = BeautifulSoup(r.text, 'html.parser')
    tables = soup.find_all('table', class_='wikitable')
    
    ministers = []
    
    # Usually Cabinet Ministers are in the first wikitable
    for table in tables:
        headers = [th.get_text(strip=True).lower() for th in table.find_all('th')]
        if "portfolio" in headers or "office" in headers or "ministry" in headers:
             rows = table.find_all('tr')[1:]
             for tr in rows:
                 cols = tr.find_all(['td', 'th'])
                 # Cleanup
                 cleaned = [clean_text(c.get_text()) for c in cols]
                 
                 # Structure varies, but often: [Portrait, Portfolio, Minister, Constituency, Term]
                 # Or: [Portfolio, Minister, Image, ...]
                 
                 # Let's look for the cell with the Minister Name (often bold or has link)
                 # Heuristic: Name usually has a link and is not the portfolio
                 
                 # Simplified for "Third Modi ministry" standard format
                 # Col 0: Portfolio? Col 1: Minister?
                 
                 portfolio = "Union Minister"
                 name = "Unknown"
                 image = ""
                 party = "BJP" # Default
                 
                 # Finding Name: usually column with person link
                 for c in cols:
                     a = c.find('a')
                     if a and a.get('title') and "Ministry" not in a.get('title'):
                         # Possible name
                         candidate = clean_text(c.get_text())
                         if len(candidate) > 3 and not "Ministry" in candidate:
                             name = candidate
                             # break? no, might be multiple
                             
                     # Check for Image
                     img = c.find('img')
                     if img:
                         src = img.get('src')
                         if src.startswith('//'): image = "https:" + src
                         else: image = src
                         
                 # Finding Portfolio:
                 for c in cols:
                     txt = clean_text(c.get_text())
                     if "Minister of" in txt or "Prime Minister" in txt:
                         portfolio = txt
                         break
                 
                 if name != "Unknown":
                      ministers.append({
                          "name": name,
                          "role": "Union Minister",
                          "portfolio": portfolio,
                          "image": image,
                          "party": "BJP" # Simplified, catching actual party is harder in this table
                      })

    # Dedupe
    unique = {m['name']: m for m in ministers}
    return list(unique.values())

def scrape_single_role(url, role_name):
    print(f"Fetching {role_name}...")
    try:
        r = requests.get(url, headers=HEADERS)
        soup = BeautifulSoup(r.text, 'html.parser')
        
        # Get Name: usually H1 or Infobox top
        infobox = soup.find('table', class_='infobox')
        name = "Unknown"
        image = scrape_infobox_image(soup)
        
        if infobox:
             # Try key "Incumbent"
             rows = infobox.find_all('tr')
             for tr in rows:
                 if "Incumbent" in tr.get_text():
                     # Format: Incumbent Name
                     name = clean_text(tr.get_text().replace("Incumbent", ""))
                     break
        
        # Fallback to Title
        if name == "Unknown" or len(name) < 3:
             # Usually "President of India" -> check first paragraph "is ..."
             pass
             
        # Hardcoded overrides if parsing fails for these stable roles (safeguard)
        if "President" in role_name and "Murmu" in r.text: name = "Droupadi Murmu"
        if "Speaker" in role_name and "Birla" in r.text: name = "Om Birla"
        if "Vice President" in role_name and "Dhankhar" in r.text: name = "Jagdeep Dhankhar"
        
        return {
            "name": name,
            "role": role_name,
            "image": image,
            "party": "N/A"
        }
    except:
        return None

def main():
    data = {}
    
    # 1. President
    pres = scrape_single_role("https://en.wikipedia.org/wiki/President_of_India", "President of India")
    if pres: data['president'] = pres
    
    # 2. VP
    vp = scrape_single_role("https://en.wikipedia.org/wiki/Vice_President_of_India", "Vice President of India")
    if vp: data['vice_president'] = vp
    
    # 3. PM (Get explicit details)
    pm = scrape_single_role("https://en.wikipedia.org/wiki/Prime_Minister_of_India", "Prime Minister")
    if pm: data['prime_minister'] = pm
    
    # 4. Speaker
    sp = scrape_single_role("https://en.wikipedia.org/wiki/Speaker_of_the_Lok_Sabha", "Speaker (Lok Sabha)")
    if sp: data['speaker'] = sp
    
    # 5. Opposition Leader
    opp = scrape_single_role("https://en.wikipedia.org/wiki/Leader_of_the_Opposition_in_Lok_Sabha", "Leader of Opposition")
    if opp: data['opposition_leader'] = opp
    
    # 6. Ministers
    ministers = scrape_council_ministers()
    data['ministers'] = ministers
    
    # Save
    json_path = "central_govt_2026.json"
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
        
    # Copy to Frontend
    frontend_dir = os.path.abspath(os.path.join(os.getcwd(), '..', 'frontend-citizen', 'src', 'data'))
    if not os.path.exists(frontend_dir):
        os.makedirs(frontend_dir)
        
    frontend_path = os.path.join(frontend_dir, 'central_govt_2026.json')
    with open(frontend_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)

    print(f"Scraped Central Govt Data. Saved to {frontend_path}")

if __name__ == "__main__":
    main()
