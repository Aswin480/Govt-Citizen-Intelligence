import streamlit as st
import httpx
import asyncio
import pandas as pd
from bs4 import BeautifulSoup
import sys
import time
import pdfplumber
import json
import sqlite3
import datetime
import google.generativeai as genai
from urllib.robotparser import RobotFileParser
from urllib.parse import urlparse
from io import StringIO, BytesIO
from urllib.parse import urljoin
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

# --- CONFIGURATION & SETUP ---
st.set_page_config(
    page_title="Universal Data Scraper Pro", 
    layout="wide", 
    page_icon="🕸️"
)

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

# --- DATABASES ---
DB_FILE = "scraper_history_new.db"
ENTITY_DB_FILE = "entity_memory_new.db"

def init_dbs():
    # History DB
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            source TEXT,
            row_count INTEGER,
            data_json TEXT,
            notes TEXT
        )
    ''')
    conn.commit()
    conn.close()
    
    # Entity Memory DB (Dynamic Knowledge Graph)
    conn = sqlite3.connect(ENTITY_DB_FILE)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS entities (
            name TEXT PRIMARY KEY,
            type TEXT,
            facts JSON,
            mentions INTEGER,
            sentiment_score REAL,
            last_updated TEXT
        )
    ''')
    conn.commit()
    conn.close()

def save_job_to_history(df, source, notes=""):
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        json_data = df.to_json(orient='records')
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        c.execute("INSERT INTO jobs (timestamp, source, row_count, data_json, notes) VALUES (?, ?, ?, ?, ?)",
                  (timestamp, source, len(df), json_data, notes))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        return False

def update_entity_memory(analysis_json):
    """Updates the dynamic entity store with new facts/entities."""
    try:
        data = json.loads(analysis_json)
        conn = sqlite3.connect(ENTITY_DB_FILE)
        c = conn.cursor()
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d")
        
        # Process Entities
        if "entities" in data:
            for ent in data["entities"]:
                # Check if exists
                c.execute("SELECT * FROM entities WHERE name=?", (ent,))
                row = c.fetchone()
                
                if row:
                    # Update Existing
                    curr_facts = json.loads(row[2]) if row[2] else []
                    new_facts = data.get("facts", [])
                    # Simple merge of unique facts
                    merged_facts = list(set(curr_facts + new_facts))
                    
                    new_mentions = row[3] + 1
                    # Simple sentiment averaging (assuming mapping)
                    sent_val = 1 if "Positive" in data.get("sentiment","") else (-1 if "Negative" in data.get("sentiment","") else 0)
                    new_sent = (row[4] * row[3] + sent_val) / new_mentions
                    
                    c.execute("""UPDATE entities SET facts=?, mentions=?, sentiment_score=?, last_updated=? WHERE name=?""",
                              (json.dumps(merged_facts), new_mentions, new_sent, timestamp, ent))
                else:
                    # Create New
                    facts = data.get("facts", [])
                    sent_val = 1 if "Positive" in data.get("sentiment","") else (-1 if "Negative" in data.get("sentiment","") else 0)
                    c.execute("INSERT INTO entities VALUES (?, ?, ?, ?, ?, ?)",
                              (ent, "Person/Org", json.dumps(facts), 1, sent_val, timestamp))
        
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Entity Update Error: {e}")
        return False

def load_history_jobs():
    conn = sqlite3.connect(DB_FILE)
    df = pd.read_sql_query("SELECT id, timestamp, source, row_count, notes FROM jobs ORDER BY id DESC", conn)
    conn.close()
    return df

def load_job_data(job_id):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT data_json FROM jobs WHERE id=?", (job_id,))
    row = c.fetchone()
    conn.close()
    if row and row[0]:
        return pd.read_json(StringIO(row[0]))
    return None

def delete_job(job_id):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("DELETE FROM jobs WHERE id=?", (job_id,))
    conn.commit()
    conn.close()

def load_knowledge_graph():
    conn = sqlite3.connect(ENTITY_DB_FILE)
    df = pd.read_sql_query("SELECT * FROM entities ORDER BY mentions DESC", conn)
    conn.close()
    return df

init_dbs()

# --- ENGINES ---
class AsyncEngine:
    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        }

    async def fetch(self, client, url):
        try:
            resp = await client.get(url, headers=self.headers, follow_redirects=True, timeout=20.0)
            return {"url": url, "content": resp.text, "status": resp.status_code, "error": None}
        except Exception as e:
            return {"url": url, "content": None, "status": 0, "error": str(e)}

class BrowserEngine:
    def __init__(self):
        options = Options()
        options.add_argument("--headless")
        options.add_argument("--disable-gpu")
        options.add_argument("--no-sandbox")
        options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-blink-features=AutomationControlled") 
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option('useAutomationExtension', False)
        options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        
        if st.session_state.get('proxy'):
             options.add_argument(f'--proxy-server={st.session_state.proxy}')

        self.options = options
        self.service = Service(ChromeDriverManager().install())
        self.driver = None

    def start(self):
        if not self.driver:
            self.driver = webdriver.Chrome(service=self.service, options=self.options)
            self.driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
                "source": """
                    Object.defineProperty(navigator, 'webdriver', {
                        get: () => undefined
                    })
                """
            })

    def stop(self):
        if self.driver:
            self.driver.quit()
            self.driver = None

    def fetch(self, url):
        if not self.driver:
            self.start()
        try:
            self.driver.get(url)
            time.sleep(2) 
            content = self.driver.page_source
            return {"url": url, "content": content, "status": 200, "error": None}
        except Exception as e:
            return {"url": url, "content": None, "status": 0, "error": str(e)}

# --- BACKEND INTEGRATION ---
API_BASE_URL = "http://localhost:8000/v1"

@st.cache_data(ttl=300)
def fetch_backend_options():
    """Fetches available Houses and States from the Backend API."""
    options = {"houses": [], "states": []}
    try:
        # Fetch Houses
        resp = httpx.get(f"{API_BASE_URL}/parliament/houses/")
        if resp.status_code == 200:
            options["houses"] = resp.json()
        
        # Fetch States
        resp = httpx.get(f"{API_BASE_URL}/states") # Note: /states is directly on root in snippets, adjusting to /v1/states as per router include
        if resp.status_code == 200:
            options["states"] = resp.json()
    except Exception as e:
        st.error(f"Backend Connection Error: {e}")
    return options

def sync_member_to_backend(member_data):
    """Sends a single member record to the backend."""
    try:
        resp = httpx.post(f"{API_BASE_URL}/parliament/members/", json=member_data)
        return resp.status_code == 200, resp.text
    except Exception as e:
        return False, str(e)


async def batch_fetch_async(urls, concurrency=10, delay=0.0):
    engine = AsyncEngine()
    sem = asyncio.Semaphore(concurrency)
    async def limited_fetch(client, u):
        async with sem:
            if delay > 0: await asyncio.sleep(delay)
            return await engine.fetch(client, u)
    async with httpx.AsyncClient(verify=False) as client:
        tasks = [limited_fetch(client, u) for u in urls]
        return await asyncio.gather(*tasks)

def extract_body_text(html):
    if not html: return ""
    soup = BeautifulSoup(html, 'html.parser')
    for tag in soup(['script', 'style', 'noscript', 'iframe', 'svg', 'button', 'input', 'meta', 'link']):
        tag.decompose()
    text = soup.get_text(separator="\n", strip=True)
    lines = [line.strip() for line in text.splitlines() if len(line.strip()) > 1]
    return "\n".join(lines)

# --- INTELLIGENCE ---
@st.cache_data
def get_available_models(api_key):
    try:
        genai.configure(api_key=api_key)
        return [m.name for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
    except: return []

def process_pdf_text_with_ai(text, api_key, model_name):
    """Uses AI to clean PDF text."""
    if not api_key: return "No API Key"
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(model_name)
        prompt = f"Clean this text. Remove page numbers/headers. Keep content:\n{text}"
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"AI Error: {str(e)}"

def analyze_entity_intelligence(text, api_key, model_name, focus="People, Organizations"):
    """Performs NER, Sentiment, and Fact Extraction with Custom Focus."""
    if not api_key: return "No API Key"
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(model_name)
        prompt = f"""
        Perform Intelligence Analysis on this text.
        
        🎯 EXTRACTION GOAL: Find all '{focus}' in the text.
        
        Output JSON with keys:
        - "entities": list of exact strings matching '{focus}' found in text.
        - "sentiment": string (Positive/Negative/Neutral)
        - "summary": 1 sentence summary
        - "facts": list of key facts relating to these entities
        
        Text:
        {text}
        """
        response = model.generate_content(prompt)
        return response.text.replace("```json", "").replace("```", "")
    except Exception as e:
        return f"Error: {e}"

def chat_with_ai(query, context, api_key, model_name):
    """Chat with the document content."""
    if not api_key: return "Please enter API Key in Config."
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(model_name)
        prompt = f"""
        You are a helpful AI Assistant. Answer the user's question based ONLY on the provided document content.
        
        Document Content (Excerpt):
        {context[:100000]}... [truncated if too long]
        
        User Question: {query}
        """
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Error: {str(e)}"

def ai_clean_dataframe(df, api_key, model_name):
    if not api_key: return None, "No API Key."
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(model_name)
        clean_source_df = df.copy()
        if 'Deep_Content' in clean_source_df.columns:
             clean_source_df = clean_source_df.drop(columns=['Deep_Content'])
        chunk_size = 40
        all_results = []
        total_batches = (len(clean_source_df) // chunk_size) + 1
        progress_bar = st.progress(0)
        status_text = st.empty()
        
        for i in range(0, len(clean_source_df), chunk_size):
            chunk = clean_source_df.iloc[i : i+chunk_size]
            current_batch = (i // chunk_size) + 1
            status_text.text(f"🧠 AI Cleaning Batch {current_batch}/{total_batches}...")
            csv_preview = chunk.to_csv(index=False)
            prompt = f"Clean this data into JSON Array. Remove junk.\nCSV:\n{csv_preview}"
            try:
                response = model.generate_content(prompt)
                cleaned_text = response.text.strip().replace("```json", "").replace("```", "")
                batch_data = json.loads(cleaned_text)
                all_results.extend(batch_data)
            except:
                all_results.extend(chunk.to_dict(orient='records'))
            progress_bar.progress(min(current_batch / total_batches, 1.0))
            if total_batches > 1: time.sleep(1.5)
        status_text.empty()
        progress_bar.empty()
        return pd.DataFrame(all_results), None
    except Exception as e:
        return None, str(e)

def extract_with_ai(html_content, api_key, model_name, url=""):
    if not api_key: return None, "No API Key"
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(model_name)
        soup = BeautifulSoup(html_content, 'html.parser')
        for s in soup(["script", "style", "svg", "nav", "footer"]): s.decompose()
        text_content = soup.get_text(separator="\n")
        prompt = f"""
        Analyze this web content at an ELITE level.
        URL: {url}
        
        Output a JSON object with these EXACT keys:
        - "title": Page title
        - "summary": 2-sentence executive summary
        - "confidence": Float (0.0-1.0) score of content reliability
        - "trends": List of strings (key trends identified)
        - "entities": List of objects {{"name": "...", "type": "...", "sentiment": "..."}}
        - "relationships": List of strings describing connections (e.g. "Entity A owns Entity B")
        - "tables": List of objects representing structured data found (rows). If no structured data, create rows from main content.
        
        Content:
        {text_content[:200000]}
        """
        response = model.generate_content(prompt)
        raw_json = response.text.strip().replace("```json", "").replace("```", "")
        data = json.loads(raw_json)
        
        # Create DataFrame from 'tables'
        if data.get("tables"):
            df = pd.DataFrame(data["tables"])
        else:
            df = pd.DataFrame([{"info": "No tabular data detected"}])
            
        # Attach Intelligence
        df.attrs['elite_intelligence'] = {
            "title": data.get("title"),
            "summary": data.get("summary"),
            "confidence": data.get("confidence"),
            "trends": data.get("trends"),
            "entities": data.get("entities"),
            "relationships": data.get("relationships")
        }
        return df, None
    except Exception as e:
        st.error(f"❌ Critical AI Error: {str(e)}")
        return None, str(e)

def parse_smart_tables(html_content):
    extracted = []
    try:
        dfs = pd.read_html(StringIO(html_content))
        for df in dfs: extracted.append(df.dropna(how='all').fillna(""))
    except: pass
    return extracted

def parse_custom(html_content, query, attr=None):
    soup = BeautifulSoup(html_content, 'lxml')
    return pd.DataFrame([{"value": el.get(attr) if attr else el.get_text(strip=True)} for el in soup.select(query)])

def parse_pdf_document(uploaded_file, progress_bar=None):
    tables_found = []
    text_buffer = StringIO()
    page_text_data = []
    
    with pdfplumber.open(uploaded_file) as pdf:
        total_pages = len(pdf.pages)
        for i, page in enumerate(pdf.pages):
            if progress_bar: progress_bar.progress((i + 1) / total_pages)
            
            # Extract Tables
            tables = page.extract_tables()
            for table in tables:
                if table:
                    headers = [str(h).strip() if h else f"Col_{j}" for j, h in enumerate(table[0])]
                    headers = [f"{h}_{headers[:j].count(h)}" if headers[:j].count(h)>0 else h for j,h in enumerate(headers)]
                    df = pd.DataFrame(table[1:], columns=headers)
                    df['Page'] = i + 1
                    tables_found.append(df)
            
            # Extract Text - RAW
            raw_text = page.extract_text()
            if raw_text:
                text_buffer.write(f"\n--- Page {i+1} ---\n{raw_text}\n")
                page_text_data.append({"Page": i + 1, "Content": raw_text})
    
    # Add Text Content as a Dataset
    if page_text_data:
        text_df = pd.DataFrame(page_text_data)
        tables_found.append(text_df)

    return tables_found, text_buffer.getvalue()

# --- GUI COMPONENTS ---
def render_news_card(row, title_col, link_col, img_col=None, summary_col=None, enable_ai=False, api_key=None, model=None, focus="People"):
    """Renders a single News Card with AI Intelligence."""
    with st.container(border=True):
        input_cols = st.columns([1, 4])
        
        # Determine Image
        img_src = None
        if img_col and img_col in row and row[img_col] != "nan" and str(row[img_col]).startswith("http"):
            img_src = row[img_col]

        with input_cols[0]:
             if img_src: st.image(img_src, use_column_width=True)
             else: st.markdown("📰")

        with input_cols[1]:
            t = row[title_col] if title_col in row else "No Title"
            st.subheader(str(t))
            
            if summary_col and summary_col in row:
                st.write(str(row[summary_col])[:300] + "...")
            
            # Actions
            ac1, ac2 = st.columns([1,1])
            with ac1:
                if link_col and link_col in row and row[link_col] and str(row[link_col]).startswith("http"):
                    st.link_button("Read Full Story 🔗", str(row[link_col]))
                else: st.caption("No Link")
            
            with ac2:
                 if enable_ai:
                    if st.button(f"🧠 Extract '{focus}'", key=f"btn_{hash(str(t))}"):
                        with st.spinner(f"Hunting for {focus}..."):
                            context = f"{t} {row[summary_col] if summary_col in row else ''}"
                            analysis = analyze_entity_intelligence(context, api_key, model, focus)
                            try:
                                update_entity_memory(analysis)
                                data = json.loads(analysis)
                                st.success(f"Found {len(data.get('entities', []))} matches!")
                                st.json(data)
                            except: st.write(analysis)

# --- HELPER: AUTO MAPPER ---
def auto_map_columns(columns):
    """Guesses column mapping based on names."""
    mapping = {"title": 0, "link": 0, "img": 0, "sum": 0}
    cols_lower = [str(c).lower() for c in columns]
    
    # Title
    for i, c in enumerate(cols_lower):
        if any(x in c for x in ['title', 'head', 'name', 'topic']):
            mapping['title'] = i; break
            
    # Link
    for i, c in enumerate(cols_lower):
        if any(x in c for x in ['link', 'url', 'href', 'web']):
            mapping['link'] = i; break
            
    # Image
    for i, c in enumerate(cols_lower):
        if any(x in c for x in ['img', 'src', 'pic', 'thumb']):
            mapping['img'] = i; break
            
    # Summary
    for i, c in enumerate(cols_lower):
        if any(x in c for x in ['desc', 'sum', 'text', 'cont']):
            mapping['sum'] = i; break
            
    return mapping

# --- MAIN ---
def main():
    st.markdown("""<style>
        .stButton button { background-color: #2a9d8f; color: white; font-weight: bold; border-radius: 5px; }
        .stTabs [data-baseweb="tab-list"] { gap: 10px; }
        .stTabs [data-baseweb="tab"] { height: 50px; white-space: pre-wrap; background-color: #4B4B4B; color: white; border-radius: 5px; padding: 10px; }
        .stTabs [aria-selected="true"] { background-color: #e63946; color: white; }
    </style>""", unsafe_allow_html=True)
    
    st.title("🕸️ Universal Scraper: Elite Edition")
    st.markdown("### The Complete News Intelligence System")
    
    # TABS
    tab_urls, tab_code, tab_pdf, tab_history, tab_news, tab_kg, tab_config = st.tabs(["🌐 Live Scraper", "📝 Raw HTML", "📄 PDF Docs", "📜 History", "📰 News Intelligence", "🧠 Knowledge Graph", "⚙️ Config"])
    
    # CONFIGURATION TAB
    with tab_config:
        st.header("⚙️ System Configuration")
        
        c1, c2 = st.columns(2)
        with c1:
            engine_mode = st.radio("Engine", ["🚀 Fast Async", "🦁 Browser Mode"], index=1, help="Browser mode is slower but handles JS/Govt sites better.")
            deep_mode = st.checkbox("🕷️ Deep Crawl (Follow Links)", value=True)
            req_delay = st.slider("Delay", 0.0, 5.0, 0.5)
            max_conc = st.slider("Concurrency", 1, 50, 5)
        
        with c2:
            # STRATEGY SELECTION
            strategies = ["✨ Auto-Pilot", "🤖 AI Universal", "📊 Smart Auto-Table", "🎨 Custom CSS"]
            selected_strategy = st.selectbox("Strategy", strategies, index=0, help="Auto-Pilot decides the best method for you.")
            
            api_key = st.text_input("Gemini API Key", value="***REMOVED***", type="password")
            
            # PRO & COMPLIANCE
            st.markdown("### 🛡️ Compliance & Network")
            use_proxy = st.checkbox("Enable Proxy", value=False)
            if use_proxy:
                st.session_state.proxy = st.text_input("Proxy URL (http://user:pass@ip:port)")
            else: st.session_state.proxy = None
            
            check_robots = st.checkbox("Respect robots.txt", value=False, help="Elite scrapers always follow formatting rules.")

            model_list = get_available_models(api_key)
            selected_model = st.selectbox("AI Model", model_list) if model_list else None
            
            sel_q = ""
            sel_a = ""
            if selected_strategy == "🎨 Custom CSS":
                sel_q = st.text_input("Selector"); sel_a = st.text_input("Attribute")

    with tab_history:
        if st.button("Refresh History"): st.rerun()
        history_df = load_history_jobs()
        if not history_df.empty:
            st.dataframe(history_df, use_container_width=True)
            job_id = st.selectbox("Load Job ID", history_df['id'])
            if st.button("📥 Load"):
                st.session_state.results = [load_job_data(job_id)]
                st.success("Loaded!")
            if st.button("🗑️ Delete"):
                delete_job(job_id); st.rerun()
                
    with tab_kg:
        st.header("🧠 Dynamic Knowledge Graph")
        try:
            kg_df = load_knowledge_graph()
            if not kg_df.empty:
                c1, c2, c3 = st.columns(3)
                c1.metric("Total Entities", len(kg_df))
                c2.metric("Total Relations Recorded", kg_df['facts'].apply(lambda x: len(json.loads(x)) if x else 0).sum())
                c3.metric("Avg Sentiment", f"{kg_df['sentiment_score'].mean():.2f}")
                
                st.dataframe(kg_df, use_container_width=True)
            else:
                st.info("Knowledge Graph is empty. Analyze some News Articles to build it!")
        except Exception as e:
            st.error(f"KG Error: {e}")

    # NEWS FEED TAB
    with tab_news:
        st.header("📰 Live News Intelligence Dashboard")
        if 'results' in st.session_state and st.session_state.results:
            # Dropdown to pick dataset
            ds_opts = [f"Dataset #{i+1}" for i in range(len(st.session_state.results))]
            sel_ds = st.selectbox("Select Source for Feed", ds_opts)
            if sel_ds:
                idx = int(sel_ds.split("#")[1]) - 1
                df = st.session_state.results[idx]
                
                # Auto-Map
                cols = ["None"] + list(df.columns)
                mapping = auto_map_columns(cols)
                
                st.caption("Column Mapping (Auto-Detected):")
                c1, c2, c3, c4 = st.columns(4)
                with c1: t_col = st.selectbox("Headline", cols, index=mapping['title'])
                with c2: l_col = st.selectbox("Link/URL", cols, index=mapping['link'])
                with c3: i_col = st.selectbox("Image URL", cols, index=mapping['img'])
                with c4: s_col = st.selectbox("Context/Summary", cols, index=mapping['sum'])
                
                enable_ner = st.checkbox("Enable Entity Intelligence (AI Analysis)", value=True)
                if enable_ner:
                    custom_focus = st.text_input("🎯 Extraction Focus (What do you want to find?)", "People, Organizations")
                else: custom_focus = "People"

                st.divider()
                if t_col != "None":
                    for i, row in df.iterrows():
                        render_news_card(row, t_col, l_col if l_col!="None" else None, 
                                            i_col if i_col!="None" else None, 
                                            s_col if s_col!="None" else None,
                                            enable_ner, api_key, selected_model, custom_focus)
        else:
            st.info("No data loaded. Scrape a news site or load from History first.")

    target_urls = []
    with tab_urls: target_urls = st.text_area("URLs").split('\n')
    with tab_code: raw_html = st.text_area("HTML")
    with tab_pdf: uploaded_pdf = st.file_uploader("PDF", type=["pdf"])

    if st.button("🚀 INITIATE EXTRACTION", use_container_width=True):
        st.toast("Starting Engine...")
        results = []
        
        # URLS
        if target_urls and target_urls[0].strip():
             valid_urls = []
             for u in target_urls:
                 if not u.strip(): continue
                 # COMPLIANCE CHECK
                 if check_robots:
                     try:
                         rp = RobotFileParser()
                         parsed_uri = urlparse(u)
                         domain = '{uri.scheme}://{uri.netloc}/'.format(uri=parsed_uri)
                         rp.set_url(domain + "robots.txt")
                         rp.read()
                         if not rp.can_fetch("*", u):
                             st.error(f"🛑 Access Denied by robots.txt: {u}")
                             continue
                     except: pass # If robots.txt fetch fails, proceed with caution
                 valid_urls.append(u)

             if "Async" in engine_mode:
                  # Update Async Engine to use Proxy if needed (Future impl)
                  loop = asyncio.new_event_loop(); asyncio.set_event_loop(loop)
                  raw_list = loop.run_until_complete(batch_fetch_async(valid_urls, max_conc, req_delay))
             else:
                  eng = BrowserEngine(); eng.start()
                  progress = st.progress(0)
                  raw_list = []
                  try:
                      for i,u in enumerate(valid_urls):
                          raw_list.append(eng.fetch(u)); time.sleep(req_delay)
                          progress.progress((i+1)/len(valid_urls))
                  finally: eng.stop()
                 
             for item in raw_list:
                  if item['content']:
                      # AUTO-PILOT LOGIC 🧠
                      current_strat = selected_strategy
                      if "Auto-Pilot" in selected_strategy:
                          table_count = item['content'].count("<table")
                          if table_count > 1:
                              st.toast(f"Build detected {table_count} tables. Routing to Smart Table Engine. 📊")
                              current_strat = "Smart Auto-Table"
                          else:
                              st.toast("Complex Layout detected. Routing to AI Engine. 🤖")
                              current_strat = "AI Universal"
                      
                      # EXECUTE STRATEGY
                      if "AI" in current_strat:
                          with st.spinner(f"AI Extracting from {item['url']}..."):
                              df, err_msg = extract_with_ai(item['content'], api_key, selected_model, item['url'])
                              if df is not None: 
                                  df['Source'] = item['url']
                                  results.append(df)
                              elif err_msg:
                                  st.error(f"❌ AI Failure: {err_msg}")
                      elif "Table" in current_strat:
                          for t in parse_smart_tables(item['content']): t['Source'] = item['url']; results.append(t)
                      elif "Custom" in current_strat:
                         df = parse_custom(item['content'], sel_q, sel_a)
                         if not df.empty: df['Source'] = item['url']; results.append(df)
        
        # DEEP CRAWL (Restored)
        if deep_mode and results:
             st.toast("🕵️ Starting Deep Crawl...")
             loop = asyncio.new_event_loop(); asyncio.set_event_loop(loop)
             for df in results:
                 link_col = None
                 for c in df.columns:
                     if any(k in str(c).lower() for k in ['link', 'url', 'href']): link_col = c; break
                 if link_col:
                     links = df[link_col].dropna().astype(str).tolist()
                     links = [urljoin(df['Source'].iloc[0], l) for l in links]
                     pages = loop.run_until_complete(batch_fetch_async(links, max_conc, req_delay))
                     df['Deep_Content'] = [extract_body_text(p['content']) for p in pages]

        # PDF
        st.session_state.pdf_text_cache = ""
        st.session_state.clean_pdf_text = ""
        if uploaded_pdf:
            st.toast("Processing PDF...")
            prog = st.progress(0)
            tables, text = parse_pdf_document(uploaded_pdf, prog)
            results.extend(tables)
            st.session_state.pdf_text_cache = text
            
        st.session_state.results = results
        if results: 
             for r in results: save_job_to_history(r, "Mixed Source")
    
    # DATA PROCESSING & OUTPUT
    if 'results' in st.session_state:
        if st.session_state.results:
            st.success(f"✅ Extracted {len(st.session_state.results)} datasets")
            
            # MERGE OPTION
            if len(st.session_state.results) > 1:
                if st.button("🧩 Merge All Datasets"):
                    merged_df = pd.concat(st.session_state.results, ignore_index=True)
                    st.dataframe(merged_df)
                    st.download_button("Download Merged CSV", merged_df.to_csv(index=False).encode(), "merged_master.csv")

            for i, df in enumerate(st.session_state.results):
                 # CHANGE DETECTION
                 is_changed = "🆕 New Data"
                 # (Simple mock for demo, real impl needs DB query)
                 # In a real app, query DB for last_hash of this URL.
                 
                 dataset_title = df.attrs.get('elite_intelligence', {}).get('title', 'Table Data')
                 with st.expander(f"Dataset {i+1} - {dataset_title} [{is_changed}]", expanded=(i==0)):
                     
                     # 🧠 ELITE VIEW
                     if 'elite_intelligence' in df.attrs:
                         intel = df.attrs['elite_intelligence']
                         ec1, ec2 = st.columns([2, 1])
                         with ec1:
                             st.subheader(f"📄 {intel.get('title', 'Untitled')}")
                             st.markdown(f"**Summary:** {intel.get('summary')}")
                             st.caption(f"Confidence: **{intel.get('confidence', 0.0)}** | Trends: {', '.join(intel.get('trends', []))}")
                         with ec2:
                             st.markdown("### 🧬 Key Entities")
                             for ent in intel.get('entities', [])[:5]:
                                 st.markdown(f"- **{ent.get('name')}** ({ent.get('type')})")
                         
                         st.markdown("### 🔗 Relationships")
                         for rel in intel.get('relationships', []):
                             st.markdown(f"- {rel}")
                         st.divider()

                     # --- PROJECT BRIDGE 🌉 ---
                     with st.expander("🌉 Project Bridge (Sync to Backend)", expanded=True):
                        st.caption("Map your data columns to the Project Database fields.")
                        
                        backend_opts = fetch_backend_options()
                        if not backend_opts["houses"]:
                            st.warning("⚠️ Backend Offline or No Houses Found. Is the server running at port 8000?")
                        else:
                            pb_c1, pb_c2 = st.columns(2)
                            
                            with pb_c1:
                                # Target House
                                house_opts = {h['name']: h['id'] for h in backend_opts['houses']}
                                sel_house_name = st.selectbox("Targets House 🏛️", list(house_opts.keys()), key=f"house_sel_{i}")
                                target_house_id = house_opts[sel_house_name] if sel_house_name else None
                                
                                # Target State
                                state_opts = {s['name']: s['id'] for s in backend_opts['states']}
                                sel_state_name = st.selectbox("Target State 🗺️", ["None"] + list(state_opts.keys()), key=f"state_sel_{i}")
                                target_state_id = state_opts[sel_state_name] if sel_state_name != "None" else None

                            with pb_c2:
                                # Column Mapping
                                df_cols = ["Select Column"] + list(df.columns)
                                map_name = st.selectbox("Name Column 👤", df_cols, key=f"map_name_{i}")
                                map_party = st.selectbox("Party Column 🚩", df_cols, key=f"map_party_{i}")
                                map_const = st.selectbox("Constituency Column 📍", df_cols, key=f"map_const_{i}")

                            if st.button(f"🔄 Sync {len(df)} Records to Database", key=f"sync_btn_{i}"):
                                if map_name == "Select Column" or map_party == "Select Column":
                                    st.error("Please map at least Name and Party columns.")
                                else:
                                    progress_text = "Syncing with Project Backend..."
                                    my_bar = st.progress(0, text=progress_text)
                                    
                                    success_count = 0
                                    errors = []
                                    
                                    for idx, row in df.iterrows():
                                        # Construct Payload
                                        member_payload = {
                                            "name": str(row[map_name]),
                                            "party": str(row[map_party]),
                                            "constituency": str(row[map_const]) if map_const != "Select Column" else "State Representative",
                                            "house_id": target_house_id,
                                            "state_id": target_state_id,
                                            "profile_image": f"https://ui-avatars.com/api/?name={str(row[map_name]).replace(' ', '+')}&background=random"
                                        }
                                        
                                        # Send
                                        ok, msg = sync_member_to_backend(member_payload)
                                        if ok: success_count += 1
                                        else: errors.append(f"{row[map_name]}: {msg}")
                                        
                                        my_bar.progress((idx + 1) / len(df), text=f"Syncing {idx+1}/{len(df)}")
                                    
                                    my_bar.empty()
                                    st.success(f"✅ Successfully Synced {success_count} Members!")
                                    if errors:
                                        with st.expander("Errors"):
                                            st.write(errors)

                     st.dataframe(df)

                     csv = df.to_csv(index=False).encode()
                     st.download_button("Download CSV", csv, f"data_{i}.csv", key=f"dl_csv_{i}")
                     try:
                        buffer = BytesIO()
                        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
                            df.to_excel(writer, index=False)
                        st.download_button("Download Excel", buffer.getvalue(), f"data_{i}.xlsx")
                     except: pass
        else:
            st.warning("⚠️ No structured data found.")
            st.info("💡 Tip: Try switching the **Strategy** in the '⚙️ Config' tab to **'🤖 AI Universal'** if the site doesn't use standard Tables.")

    # PDF TEXT PROCESSING (Combined)
    if 'pdf_text_cache' in st.session_state and st.session_state.pdf_text_cache:
        st.divider()
        st.subheader("📄 Full PDF Text Explorer")
        st.download_button("⬇️ Download All Text (.txt)", st.session_state.pdf_text_cache, "full_pdf_content.txt")
        
        # Find the Text Dataset for Paging
        text_df = None
        if 'results' in st.session_state:
            for df in st.session_state.results:
                if 'Page' in df.columns and 'Content' in df.columns:
                    text_df = df
                    break
        
        c_prev, c_clean = st.columns([2, 1])
        with c_prev:
            if text_df is not None and not text_df.empty:
                total_pgs = int(text_df['Page'].max())
                view_mode = st.radio("View Mode", ["📖 Page by Page", "📜 Full Document (All Pages)"], horizontal=True)
                
                if "Page" in view_mode:
                    sel_pg = st.slider(f"Select Page (1-{total_pgs})", 1, total_pgs, 1)
                    pg_content = text_df[text_df['Page'] == sel_pg]['Content'].iloc[0] if not text_df[text_df['Page'] == sel_pg].empty else ""
                    st.text_area(f"Page {sel_pg} Content", pg_content, height=400)
                else:
                    st.warning(f"⚠️ Displaying {len(st.session_state.pdf_text_cache)} characters. This might be slow.")
                    st.text_area("Full Document Content", st.session_state.pdf_text_cache, height=600)
            else:
                # Fallback if dataframe not found
                total_chars = len(st.session_state.pdf_text_cache)
                st.caption(f"Showing first 5,000 chars of {total_chars} total characters.")
                st.text_area("Preview (Raw)", st.session_state.pdf_text_cache[:5000] + "...", height=400)
        
        with c_clean:
            st.info(f"💡 Total Characters Extracted: {len(st.session_state.pdf_text_cache)}")
            if st.button("✨ Clean with AI (Remove Page #s)"):
                with st.spinner("AI is determining what is useless content..."):
                    clean_txt = process_pdf_text_with_ai(st.session_state.pdf_text_cache, api_key, selected_model)
                    st.session_state.clean_pdf_text = clean_txt
                    st.rerun()
            
        if 'clean_pdf_text' in st.session_state and st.session_state.clean_pdf_text:
                st.text_area("Cleaned Text", st.session_state.clean_pdf_text, height=300)
                st.download_button("Download Clean Text", st.session_state.clean_pdf_text, "cleaned_pdf.txt")

        # KNOWLEDGE GRAPH BUILDER
        st.divider()
        st.subheader("🧠 Build Knowledge Memory")
        st.caption("Extract entities (People, Orgs, Facts) from this document into your specific Knowledge Graph.")
        if st.button("🚀 Analyze & Save to Graph"):
             with st.spinner("Mining Knowledge from Document..."):
                 # Use clean if avail, else raw
                 ctx = st.session_state.clean_pdf_text if st.session_state.clean_pdf_text else st.session_state.pdf_text_cache
                 analysis = analyze_entity_intelligence(ctx, api_key, selected_model, focus="People, Organizations, Key Concepts")
                 try:
                     update_entity_memory(analysis)
                     data = json.loads(analysis)
                     st.success(f"✅ Extracted {len(data.get('entities', []))} Entities! Check 'Knowledge Graph' tab.")
                     st.json(data)
                 except: st.error("Failed to parse AI response.")

        # CHAT INTERFACE
        st.divider()
        st.subheader("💬 Chat with your Document")
        
        if "chat_history" not in st.session_state: st.session_state.chat_history = []
        
        for msg in st.session_state.chat_history:
            st.chat_message(msg["role"]).write(msg["content"])
            
        if user_query := st.chat_input("Ask a question about this PDF..."):
            st.session_state.chat_history.append({"role": "user", "content": user_query})
            st.chat_message("user").write(user_query)
            
            with st.spinner("AI is reading the document..."):
                # Use clean text if available, else raw
                ctx = st.session_state.clean_pdf_text if st.session_state.clean_pdf_text else st.session_state.pdf_text_cache
                answer = chat_with_ai(user_query, ctx, api_key, selected_model)
                
            st.session_state.chat_history.append({"role": "assistant", "content": answer})
            st.chat_message("assistant").write(answer)

if __name__ == "__main__":
    main()

