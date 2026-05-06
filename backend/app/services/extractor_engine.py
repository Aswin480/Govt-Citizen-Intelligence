import pandas as pd
import json
import io
import requests
import time
import re
import random
from bs4 import BeautifulSoup
import pdfplumber
from google import genai
import os
from io import StringIO, BytesIO
from urllib.parse import urljoin, urlparse
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

# --- CONFIGURATION ---
DEFAULT_API_KEY = "***REMOVED***" # Shared Key

class EliteScraperEngine:
    """
    The '100/100' Dynamic Scraping Engine.
    Designed for longevity: Uses a fallback strategy of API -> CSS -> DOM -> AI.
    """
    
    def __init__(self, use_proxy=False, proxy_url=None):
        api_key_val = os.getenv("GEMINI_API_KEY", DEFAULT_API_KEY)
        self.client = genai.Client(api_key=api_key_val)
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5"
        }
        self.proxies = {"http": proxy_url, "https": proxy_url} if (use_proxy and proxy_url) else None

    def fetch_page(self, url, retries=3):
        """Robust fetcher using Playwright headless browser with retries."""
        for attempt in range(retries):
            try:
                print(f"🌐 [ENGINE 1.0] Fetching with Playwright (Attempt {attempt+1}/{retries})... {url}")
                with sync_playwright() as p:
                    # Launch browser
                    browser = p.chromium.launch(headless=True)
                    # Create context with standard user agent to avoid anti-bot
                    context = browser.new_context(
                        user_agent=self.headers["User-Agent"],
                        viewport={'width': 1920, 'height': 1080}
                    )
                    page = context.new_page()
                    
                    # Navigate to URL, wait for network conditions
                    page.goto(url, wait_until="networkidle", timeout=30000)
                    
                    # Optional: wait for a short bit to allow React/Vue to hydrate
                    page.wait_for_timeout(2000)
                    
                    # Extract HTML
                    html = page.content()
                    browser.close()
                    return html
                    
            except PlaywrightTimeoutError:
                print(f"⚠️ Playwright Timeout ({url}). Retrying...")
            except Exception as e:
                print(f"⚠️ Fetch Error ({url}): {e}")
                
            wait = (2 ** attempt) + random.random()
            print(f"Retrying in {wait:.2f}s...")
            time.sleep(wait)
            
        print(f"❌ Playwright completely failed. Falling back to simple HTTP request...")
        try:
            # Absolute fallback
            res = requests.get(url, headers=self.headers, proxies=self.proxies, timeout=15)
            res.raise_for_status()
            return res.text
        except Exception as e:
            print(f"❌ Absolute fallback failed: {e}")
            return None

    def clean_data(self, df):
        """Standardizes dataframes for database ingestion."""
        if df.empty: return df
        df = df.astype(str) # Convert all to string for consistency
        for col in df.columns:
            df[col] = df[col].str.strip()
            # Remove empty columns
            if df[col].str.len().sum() == 0:
                df.drop(columns=[col], inplace=True)
        return df

    def extract_tables(self, html, url=""):
        """Strategy 1: Heuristic DOM Table Extraction (Fastest)."""
        extracted = []
        try:
            dfs = pd.read_html(StringIO(html))
            for i, df in enumerate(dfs):
                df = self.clean_data(df)
                if not df.empty and len(df) > 1:
                    extracted.append({
                        "type": "table",
                        "strategy": "dom_heuristic",
                        "data": df.to_dict(orient='records'),
                        "columns": list(df.columns),
                        "source": url
                    })
        except: pass
        return extracted

    def extract_with_ai(self, html, schema_prompt="key entities"):
        """Strategy 2: AI Generative Extraction (Most Robust, Slowest)."""
        try:
            # Minify HTML to save tokens
            soup = BeautifulSoup(html, 'html.parser')
            for tag in soup(['script', 'style', 'nav', 'footer', 'svg']):
                tag.decompose()
            clean_text = soup.get_text(" ", strip=True)[:30000] # Limit context

            prompt = f"""
            Analyze this text and extract structured data.
            Goal: Extract {schema_prompt}.
            
            CRITICAL: Also identify the structural pattern (CSS selectors or key phrases) used to find this data.
            
            Return ONLY a JSON object with this key: 
            "dataset": [ {{ ...row_data... }} ],
            "learned_pattern": "Describe the structure (e.g. div.card-body or table.views-table)"
            
            Text:
            {clean_text}
            """
            
            response = self.client.models.generate_content(
                model='gemini-2.5-pro',
                contents=prompt
            )
            raw = response.text.replace("```json", "").replace("```", "").strip()
            data = json.loads(raw)
            
            if "dataset" in data and isinstance(data["dataset"], list):
                 return [{
                    "type": "ai_extraction",
                    "strategy": "generative_ai",
                    "data": data["dataset"],
                    "learned_pattern": data.get("learned_pattern", "unknown"),
                    "columns": list(data["dataset"][0].keys()) if data["dataset"] else [],
                    "source": "ai_inference"
                }]
            return []
        except Exception as e:
            print(f"AI Extraction Failed: {e}")
            return []

    def extract_with_heuristics(self, html):
        """
        Strategy 1.5: Advanced Pattern Matching (The '80%' Manual Layer).
        Extracts lists and weirdly formatted divs without AI.
        """
        results = []
        soup = BeautifulSoup(html, 'html.parser')
        
        # Pattern A: Definition Lists (common in gov sites)
        dl_data = {}
        for dl in soup.find_all('dl'):
            keys = dl.find_all('dt')
            vals = dl.find_all('dd')
            if len(keys) == len(vals):
                for k, v in zip(keys, vals):
                    dl_data[k.get_text(strip=True)] = v.get_text(strip=True)
        if dl_data:
            results.append({"type": "key_value", "data": [dl_data], "strategy": "manual_dl"})
            
        # Pattern B: Div-based Grids (common in member directories)
        # Look for repetitive structures
        cards = []
        possible_cards = soup.find_all('div', class_=re.compile(r'(card|item|member|profile)'))
        for card in possible_cards:
            text = card.get_text(" | ", strip=True)
            if len(text) > 10:
                cards.append({"raw_text": text})
        
        if len(cards) > 5:
             results.append({"type": "cards", "data": cards, "strategy": "manual_div"})
             
        return results

    def run_dynamic(self, config):
        """
        Master method to execute a dynamic scraping job.
        Config structure:
        {
            "url": "https://...",
            "target_schema": "CM Name, Party, State", # Optional description for AI
            "force_ai": False
        }
        """
        results = []
        url = config.get("url")
        html = self.fetch_page(url)
        
        if not html:
            return {"status": "error", "message": "Failed to fetch URL"}

        # 1. Strategy A: Standard Table Extraction (Fastest - 40%)
        # Gov sites love <table> tags.
        tables = self.extract_tables(html, url)
        if tables:
            results.extend(tables)
            print(f"⚡ [ELITE] Extracted {len(tables)} tables via Pandas (Manual).")

        # 2. Strategy B: Advanced Heuristics (Manual - 40%)
        # If tables failed, or we want more data, look for lists/divs.
        if not results:
            heuristics = self.extract_with_heuristics(html)
            if heuristics:
                results.extend(heuristics)
                print(f"🧠 [ELITE] Extracted {len(heuristics)} datasets via Heuristics (Manual).")

        # 3. Strategy C: AI Vision Fallback (The '20%' Safety Net)
        # ONLY if Manual methods failed OR the user explicitly forced it for complex cleaning.
        if not results or config.get("force_ai"):
            print("🤖 [ELITE] Manual extraction insufficient. Engaging AI Vision...")
            schema = config.get("target_schema", "relevant tabular data")
            ai_data = self.extract_with_ai(html, schema)
            results.extend(ai_data)

        return {
            "status": "success",
            "job_config": config,
            "datasets": results,
            "timestamp": time.time()
        }

# --- LEGACY WRAPPERS (Preserving existing function signatures) ---
def extract_from_url(url):
    engine = EliteScraperEngine()
    return engine.run_dynamic({"url": url})

def ai_process_content(content, prompt_type="members"):
    engine = EliteScraperEngine()
    return engine.extract_with_ai(content, prompt_type)

def extract_from_pdf(file_bytes):
    # Kept as standalone utility for now
    extracted = []
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for i, page in enumerate(pdf.pages):
                tables = page.extract_tables()
                for table in tables:
                    if table:
                         df = pd.DataFrame(table[1:], columns=[str(h) for h in table[0]])
                         extracted.append(df.to_dict(orient='records'))
        return {"status": "success", "datasets": extracted}
    except Exception as e:
        return {"status": "error", "message": str(e)}
