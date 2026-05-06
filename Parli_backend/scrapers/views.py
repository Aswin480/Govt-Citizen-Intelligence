from django.http import JsonResponse
from rest_framework.decorators import api_view
from scrapers.models import Bill, MLA, LokSabhaAttendance, RajyaSabhaAttendance, Governor

import requests
import pandas as pd
from bs4 import BeautifulSoup
import io
import re
import time

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

@api_view(['POST', 'GET'])
def scrape_bills(request):
    limit = int(request.GET.get('limit_pages', 1) or request.data.get('limit_pages', 1))
    base_url = "https://sansad.in/api_rs/legislation/getBills?loksabha=&sessionNo=&billName=&house=Lok%20Sabha&ministryName=&billType=&billCategory=&billStatus=&introductionDateFrom=&introductionDateTo=&passedInLsDateFrom=&passedInLsDateTo=&passedInRsDateFrom=&passedInRsDateTo=&size=10&locale=en&sortOn=billIntroducedDate&sortBy=desc"
    
    scraped_count = 0
    for page in range(1, limit + 1):
        try:
            url = f"{base_url}&page={page}"
            response = requests.get(url, headers=headers)
            if response.status_code == 200:
                data = response.json()
                records = data.get('records', [])
                if not records:
                    break
                for rec in records:
                    Bill.objects.update_or_create(
                        bill_name=rec.get('billName', ''),
                        defaults={
                            'bill_number': rec.get('billNumber'),
                            'bill_type': rec.get('billType'),
                            'bill_category': rec.get('billCategory'),
                            'ministry_name': rec.get('ministryName'),
                            'bill_year': rec.get('billYear'),
                            'status': rec.get('status')
                        }
                    )
                    scraped_count += 1
        except Exception:
            pass
            
    return JsonResponse({'status': 'success', 'message': f'Scraped and saved {scraped_count} bills.'})

@api_view(['POST', 'GET'])
def scrape_mla(request):
    limit_val = request.GET.get('limit_states') or request.data.get('limit_states')
    limit = int(limit_val) if limit_val else None
    
    mla_urls = [
        "https://en.wikipedia.org/wiki/Andhra_Pradesh_Legislative_Assembly",
        "https://en.wikipedia.org/wiki/Arunachal_Pradesh_Legislative_Assembly",
        "https://en.wikipedia.org/wiki/Assam_Legislative_Assembly",
        "https://en.wikipedia.org/wiki/Bihar_Legislative_Assembly",
        "https://en.wikipedia.org/wiki/Chhattisgarh_Legislative_Assembly",
        "https://en.wikipedia.org/wiki/Goa_Legislative_Assembly",
        "https://en.wikipedia.org/wiki/Gujarat_Legislative_Assembly",
        "https://en.wikipedia.org/wiki/Haryana_Legislative_Assembly",
        "https://en.wikipedia.org/wiki/Himachal_Pradesh_Legislative_Assembly",
        "https://en.wikipedia.org/wiki/Jharkhand_Legislative_Assembly",
        "https://en.wikipedia.org/wiki/Karnataka_Legislative_Assembly",
        "https://en.wikipedia.org/wiki/Kerala_Legislative_Assembly",
        "https://en.wikipedia.org/wiki/Madhya_Pradesh_Legislative_Assembly",
        "https://en.wikipedia.org/wiki/Maharashtra_Legislative_Assembly",
        "https://en.wikipedia.org/wiki/Manipur_Legislative_Assembly",
        "https://en.wikipedia.org/wiki/Meghalaya_Legislative_Assembly",
        "https://en.wikipedia.org/wiki/Mizoram_Legislative_Assembly",
        "https://en.wikipedia.org/wiki/Nagaland_Legislative_Assembly",
        "https://en.wikipedia.org/wiki/Odisha_Legislative_Assembly",
        "https://en.wikipedia.org/wiki/Punjab_Legislative_Assembly",
        "https://en.wikipedia.org/wiki/Rajasthan_Legislative_Assembly",
        "https://en.wikipedia.org/wiki/Sikkim_Legislative_Assembly",
        "https://en.wikipedia.org/wiki/Tamil_Nadu_Legislative_Assembly",
        "https://en.wikipedia.org/wiki/Telangana_Legislative_Assembly",
        "https://en.wikipedia.org/wiki/Tripura_Legislative_Assembly",
        "https://en.wikipedia.org/wiki/Uttar_Pradesh_Legislative_Assembly",
        "https://en.wikipedia.org/wiki/Uttarakhand_Legislative_Assembly",
        "https://en.wikipedia.org/wiki/West_Bengal_Legislative_Assembly",
        "https://en.wikipedia.org/wiki/Delhi_Legislative_Assembly",
        "https://en.wikipedia.org/wiki/Jammu_and_Kashmir_Legislative_Assembly",
        "https://en.wikipedia.org/wiki/Puducherry_Legislative_Assembly",
    ]
    
    ministers_urls = {
        "Andhra Pradesh": [
            "https://en.wikipedia.org/wiki/Andhra_Pradesh_Council_of_Ministers",
            "https://en.wikipedia.org/wiki/Government_of_Andhra_Pradesh"
        ],
        "Arunachal Pradesh": [
            "https://en.wikipedia.org/wiki/Pema_Khandu_ministry",
            "https://en.wikipedia.org/wiki/Government_of_Arunachal_Pradesh"
        ],
        "Assam": [
            "https://en.wikipedia.org/wiki/Himanta_Biswa_Sarma_ministry",
            "https://en.wikipedia.org/wiki/Government_of_Assam"
        ],
        "Bihar": ["https://en.wikipedia.org/wiki/Government_of_Bihar"],
        "Chhattisgarh": [
            "https://en.wikipedia.org/wiki/Chhattisgarh_Council_of_Ministers",
            "https://en.wikipedia.org/wiki/Government_of_Chhattisgarh"
        ],
        "Goa": [
            "https://en.wikipedia.org/wiki/Pramod_Sawant_ministry",
            "https://en.wikipedia.org/wiki/Government_of_Goa"
        ],
        "Gujarat": [
            "https://en.wikipedia.org/wiki/Gujarat_Council_of_Ministers",
            "https://en.wikipedia.org/wiki/Government_of_Gujarat"
        ],
        "Haryana": [
            "https://en.wikipedia.org/wiki/Nayab_Singh_Saini_ministry",
            "https://en.wikipedia.org/wiki/Saini_ministry",
            "https://en.wikipedia.org/wiki/Government_of_Haryana"
        ],
        "Himachal Pradesh": [
            "https://en.wikipedia.org/wiki/Himachal_Pradesh_Council_of_Ministers",
            "https://en.wikipedia.org/wiki/Government_of_Himachal_Pradesh"
        ],
        "Jharkhand": [
            "https://en.wikipedia.org/wiki/Jharkhand_Council_of_Ministers",
            "https://en.wikipedia.org/wiki/Government_of_Jharkhand"
        ],
        "Karnataka": [
            "https://en.wikipedia.org/wiki/Karnataka_Council_of_Ministers",
            "https://en.wikipedia.org/wiki/Government_of_Karnataka"
        ],
        "Kerala": [
            "https://en.wikipedia.org/wiki/Kerala_Council_of_Ministers",
            "https://en.wikipedia.org/wiki/Government_of_Kerala"
        ],
        "Madhya Pradesh": [
            "https://en.wikipedia.org/wiki/Mohan_Yadav_ministry",
            "https://en.wikipedia.org/wiki/Government_of_Madhya_Pradesh"
        ],
        "Maharashtra": [
            "https://en.wikipedia.org/wiki/Maharashtra_Council_of_Ministers",
            "https://en.wikipedia.org/wiki/Government_of_Maharashtra"
        ],
        "Manipur": [
            "https://en.wikipedia.org/wiki/N._Biren_Singh_ministry",
            "https://en.wikipedia.org/wiki/Government_of_Manipur"
        ],
        "Meghalaya": ["https://en.wikipedia.org/wiki/Government_of_Meghalaya"],
        "Mizoram": ["https://en.wikipedia.org/wiki/Government_of_Mizoram"],
        "Nagaland": ["https://en.wikipedia.org/wiki/Government_of_Nagaland"],
        "Odisha": [
            "https://en.wikipedia.org/wiki/Majhi_ministry",
            "https://en.wikipedia.org/wiki/Government_of_Odisha"
        ],
        "Punjab": [
            "https://en.wikipedia.org/wiki/Punjab_Council_of_Ministers",
            "https://en.wikipedia.org/wiki/Government_of_Punjab"
        ],
        "Rajasthan": [
            "https://en.wikipedia.org/wiki/Bhajan_Lal_Sharma_ministry",
            "https://en.wikipedia.org/wiki/Government_of_Rajasthan"
        ],
        "Sikkim": ["https://en.wikipedia.org/wiki/Government_of_Sikkim"],
        "Tamil Nadu": [
            "https://en.wikipedia.org/wiki/Tamil_Nadu_Council_of_Ministers",
            "https://en.wikipedia.org/wiki/Government_of_Tamil_Nadu"
        ],
        "Telangana": [
            "https://en.wikipedia.org/wiki/Telangana_Council_of_Ministers",
            "https://en.wikipedia.org/wiki/Government_of_Telangana"
        ],
        "Tripura": ["https://en.wikipedia.org/wiki/Government_of_Tripura"],
        "Uttar Pradesh": [
            "https://en.wikipedia.org/wiki/Uttar_Pradesh_Council_of_Ministers",
            "https://en.wikipedia.org/wiki/Government_of_Uttar_Pradesh"
        ],
        "Uttarakhand": [
            "https://en.wikipedia.org/wiki/Uttarakhand_Council_of_Ministers",
            "https://en.wikipedia.org/wiki/Government_of_Uttarakhand"
        ],
        "West Bengal": [
            "https://en.wikipedia.org/wiki/Third_Mamata_Banerjee_ministry",
            "https://en.wikipedia.org/wiki/Government_of_West_Bengal"
        ],
        "Delhi": [
            "https://en.wikipedia.org/wiki/Atishi_ministry",
            "https://en.wikipedia.org/wiki/Government_of_Delhi"
        ],
        "Puducherry": ["https://en.wikipedia.org/wiki/Government_of_Puducherry"],
        "Jammu and Kashmir": ["https://en.wikipedia.org/wiki/Government_of_Jammu_and_Kashmir"]
    }
    
    if limit is not None:
        mla_urls = mla_urls[:limit]
        
    all_members = []
    
    def get_best_column(df, candidates):
        best_col = None
        max_valid = -1
        for col in candidates:
            clean_col = df[col].astype(str).apply(lambda x: str(x).split('|URL:')[0].split('|COLOR:')[0].strip())
            valid_count = clean_col.replace('nan', '').replace('None', '').replace('', pd.NA).notna().sum()
            if valid_count > max_valid:
                max_valid = valid_count
                best_col = col
        return best_col

    def clean_and_standardize_table(df, state_name):
        std_cols = {}
        cols_lower = [str(c).lower().strip() for c in df.columns]
        
        district_cands = [orig_c for c, orig_c in zip(cols_lower, df.columns) if 'district' in c]
        if district_cands: std_cols['District'] = get_best_column(df, district_cands)
                
        c_no_cands = [orig_c for c, orig_c in zip(cols_lower, df.columns) if c in ['no.', 'no', '#', 'ac. no.', 'constituency no.', 'constituency no']]
        if c_no_cands: std_cols['Constituency No.'] = get_best_column(df, c_no_cands)
                
        c_name_cands = [orig_c for c, orig_c in zip(cols_lower, df.columns) if 'constituency' in c and c not in ['constituency no.', 'constituency no', 'lok sabha constituency']]
        if c_name_cands: std_cols['Constituency'] = get_best_column(df, c_name_cands)
                
        member_cands = [orig_c for c, orig_c in zip(cols_lower, df.columns) if 'name' in c or ('member' in c and 'party' not in c and 'remark' not in c and 'group' not in c)]
        if member_cands: std_cols['Member'] = get_best_column(df, member_cands)
                
        party_cands = [orig_c for c, orig_c in zip(cols_lower, df.columns) if 'party' in c or 'group' in c]
        if party_cands: std_cols['Party'] = get_best_column(df, party_cands)
                
        remark_cands = [orig_c for c, orig_c in zip(cols_lower, df.columns) if 'remark' in c or 'status' in c or 'notes' in c]
        if remark_cands: std_cols['Remarks'] = get_best_column(df, remark_cands)

        out_df = pd.DataFrame()
        out_df['State/UT'] = [state_name] * len(df)
        out_df['District'] = df[std_cols['District']] if 'District' in std_cols else pd.NA
        out_df['Constituency No.'] = df[std_cols['Constituency No.']] if 'Constituency No.' in std_cols else pd.NA
        out_df['Constituency'] = df[std_cols['Constituency']] if 'Constituency' in std_cols else pd.NA
        out_df['Member'] = df[std_cols['Member']] if 'Member' in std_cols else pd.NA
        out_df['Party'] = df[std_cols['Party']] if 'Party' in std_cols else pd.NA
        out_df['Remarks'] = df[std_cols['Remarks']] if 'Remarks' in std_cols else pd.NA
        
        if 'Member' in std_cols:
            def extract_url(x):
                s = str(x)
                if pd.notna(x) and '|URL:' in s:
                    return 'https://en.wikipedia.org' + s.split('|URL:')[1].split(' |')[0].strip()
                return pd.NA
            out_df['Member Profile'] = out_df['Member'].apply(extract_url)
        else:
            out_df['Member Profile'] = pd.NA
            
        def extract_color(row):
            for val in row.values:
                s = str(val)
                if pd.notna(val) and '|COLOR:' in s:
                    return s.split('|COLOR:')[1].split(' |')[0].strip()
            return pd.NA
        out_df['Party Color'] = df.apply(extract_color, axis=1)
        
        for col in out_df.columns:
            if out_df[col].dtype == object and col not in ['Member Profile', 'Party Color']:
                out_df[col] = out_df[col].apply(lambda x: re.sub(r'\[.*?\]', '', str(x)) if pd.notna(x) else x)
                out_df[col] = out_df[col].apply(lambda x: str(x).split('|URL:')[0].split('|COLOR:')[0].strip() if pd.notna(x) else x)
                out_df[col] = out_df[col].replace('nan', pd.NA)
                
        out_df.dropna(subset=['Constituency', 'Member', 'Party'], how='all', inplace=True)
        
        if 'Constituency' in out_df.columns:
            out_df.drop_duplicates(subset=['Constituency'], keep='last', inplace=True)
            
        if out_df['Constituency No.'].isna().all():
            out_df['Constituency No.'] = range(1, len(out_df) + 1)
        
        return out_df

    # 1. Scrape MLAs
    for url in mla_urls:
        state_name = url.split('/')[-1].replace('_Legislative_Assembly', '').replace('_', ' ')
        try:
            r = requests.get(url, headers=headers)
            if r.status_code == 200:
                soup = BeautifulSoup(r.text, 'html.parser')
                for table in soup.find_all('table', class_='wikitable'):
                    for td in table.find_all(['td', 'th']):
                        a_tag = td.find('a')
                        if a_tag and a_tag.has_attr('href') and a_tag['href'].startswith('/wiki/') and not a_tag['href'].startswith('/wiki/File:'):
                            td.append(" |URL:" + a_tag['href'])
                            
                        color = None
                        if td.has_attr('style'):
                            match = re.search(r'background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6}|\w+)', td['style'])
                            if match: color = match.group(1)
                        if not color and td.has_attr('bgcolor'): color = td['bgcolor']
                        if color: td.append(" |COLOR:" + color)
                
                modified_html = str(soup)
                tables = pd.read_html(io.StringIO(modified_html))
                member_table = None
                max_rows = 0
                for table in tables:
                    if isinstance(table.columns, pd.MultiIndex):
                        table.columns = [' '.join(col).strip() for col in table.columns.values]
                    cols_lower = [str(c).lower() for c in table.columns]
                    if any('constituency' in c for c in cols_lower) and len(table) > max_rows:
                        member_table = table
                        max_rows = len(table)
                        
                if member_table is not None:
                    cleaned_df = clean_and_standardize_table(member_table, state_name)
                    all_members.append(cleaned_df)
        except Exception:
            pass
            
    mla_df = pd.concat(all_members, ignore_index=True) if all_members else pd.DataFrame()
    
    # 2. Scrape Ministers
    all_ministers = []
    limit_keys = list(ministers_urls.keys())
    if limit is not None:
        limit_keys = limit_keys[:limit]
        
    for state in limit_keys:
        url_list = ministers_urls.get(state, [])
        for url in url_list:
            try:
                r = requests.get(url, headers=headers)
                if r.status_code == 200:
                    soup = BeautifulSoup(r.text, 'html.parser')
                    tables = soup.find_all('table', class_='wikitable')
                    best_table = None
                    col_mapping = {}
                    for table in tables:
                        th_tags = table.find_all('th') or (table.find('tr').find_all(['th', 'td']) if table.find('tr') else [])
                        headers_text = [re.sub(r'\[.*?\]', '', th.get_text(separator=" ").strip()).lower() for th in th_tags]
                        
                        if any(any(kw in h for kw in ['minister', 'portfolio', 'department', 'charges', 'ministry', 'officeholder']) for h in headers_text):
                            best_table = table
                            for idx, h in enumerate(headers_text):
                                if any(kw in h for kw in ['minister', 'name', 'officeholder']):
                                    if 'minister' not in col_mapping: col_mapping['minister'] = idx
                                if any(kw in h for kw in ['portfolio', 'department', 'charges', 'ministry']):
                                    if 'portfolio' not in col_mapping: col_mapping['portfolio'] = idx
                                if any(kw in h for kw in ['party']):
                                    if 'party' not in col_mapping: col_mapping['party'] = idx
                                if any(kw in h for kw in ['constituency', 'seat']):
                                    if 'constituency' not in col_mapping: col_mapping['constituency'] = idx
                            break
                            
                    if best_table is not None:
                        tr_tags = best_table.find_all('tr')
                        matrix = [[None] * 20 for _ in range(len(tr_tags))]
                        for r_idx, tr in enumerate(tr_tags):
                            c_idx = 0
                            td_tags = tr.find_all(['td', 'th'])
                            for td in td_tags:
                                while matrix[r_idx][c_idx] is not None: c_idx += 1
                                rowspan = int(td.get('rowspan', 1))
                                colspan = int(td.get('colspan', 1))
                                text = re.sub(r'\[.*?\]', '', td.get_text(separator=" ").strip())
                                text = re.sub(r'\s+', ' ', text)
                                for r_i in range(rowspan):
                                    for c_i in range(colspan):
                                        if r_idx + r_i < len(matrix):
                                            matrix[r_idx + r_i][c_idx + c_i] = text
                                c_idx += colspan
                                
                        if 'minister' not in col_mapping: col_mapping['minister'] = 1
                        if 'portfolio' not in col_mapping: col_mapping['portfolio'] = 2
                        if 'party' not in col_mapping: col_mapping['party'] = 3
                        if 'constituency' not in col_mapping: col_mapping['constituency'] = 4
                        
                        for r in matrix[1:]:
                            if not any(r) or r[0] is None: continue
                            m_name = r[col_mapping['minister']] if col_mapping['minister'] < len(r) and r[col_mapping['minister']] else ""
                            port = r[col_mapping['portfolio']] if col_mapping['portfolio'] < len(r) and r[col_mapping['portfolio']] else ""
                            party = r[col_mapping['party']] if col_mapping['party'] < len(r) and r[col_mapping['party']] else ""
                            const = r[col_mapping['constituency']] if col_mapping['constituency'] < len(r) and r[col_mapping['constituency']] else ""
                            
                            if any(kw in m_name.lower() for kw in ['minister', 'name']) and any(kw in port.lower() for kw in ['portfolio', 'department']):
                                continue
                            if m_name and port:
                                is_cm = "Yes" if any(kw in m_name.lower() or kw in port.lower() for kw in ['chief minister', 'cm']) else "No"
                                all_ministers.append({
                                    'State/UT': state, 'Minister': m_name, 'Portfolio': port,
                                    'Constituency': const, 'Party': party, 'Is Chief Minister': is_cm
                                })
            except Exception:
                pass
                
    ministers_df = pd.DataFrame(all_ministers) if all_ministers else pd.DataFrame()
    
    # 3. Merging MLA & Ministers Data
    def clean_for_match(name):
        if pd.isna(name): return ""
        n = re.sub(r'\b(shri|sri|dr\.|dr|adv\.|adv|smv\.|smv|capt\.|prof\.|prof|mr\.|mrs\.|ms\.)\b', '', str(name), flags=re.IGNORECASE)
        n = re.sub(r'[^a-zA-Z0-9\s]', '', n)
        return ' '.join(n.lower().split())

    if not mla_df.empty:
        mla_df['match_key'] = mla_df['Member'].apply(clean_for_match)
        mla_df['Is Minister'] = 'No'
        mla_df['Portfolio'] = pd.NA
        mla_df['Is Chief Minister'] = 'No'
        
    if not ministers_df.empty:
        ministers_df['match_key'] = ministers_df['Minister'].apply(clean_for_match)
        
    matched_indices = set()
    if not mla_df.empty and not ministers_df.empty:
        for idx, row in ministers_df.iterrows():
            m_state = row['State/UT']
            m_key = row['match_key']
            if not m_key: continue
            mask = (mla_df['State/UT'] == m_state) & (mla_df['match_key'] == m_key)
            if not mask.any():
                mask = (mla_df['State/UT'] == m_state) & (mla_df['match_key'].apply(lambda x: m_key in x or x in m_key if x else False))
            if mask.any():
                mla_df.loc[mask, 'Is Minister'] = 'Yes'
                mla_df.loc[mask, 'Portfolio'] = row['Portfolio']
                mla_df.loc[mask, 'Is Chief Minister'] = row['Is Chief Minister']
                matched_indices.add(idx)
                
    # Save MLA items directly to database
    scraped_count = 0
    if not mla_df.empty:
        for idx, row in mla_df.iterrows():
            MLA.objects.update_or_create(
                member=row['Member'],
                state_ut=row['State/UT'],
                defaults={
                    'district': row.get('District'),
                    'constituency_no': row.get('Constituency No.'),
                    'constituency': row.get('Constituency'),
                    'party': row.get('Party'),
                    'remarks': row.get('Remarks'),
                    'member_profile': row.get('Member Profile'),
                    'party_color': row.get('Party Color'),
                    'is_minister': row.get('Is Minister', 'No'),
                    'portfolio': row.get('Portfolio'),
                    'is_chief_minister': row.get('Is Chief Minister', 'No')
                }
            )
            scraped_count += 1
            
    # Append unmatched ministers
    if not ministers_df.empty:
        unmatched = ministers_df.drop(index=list(matched_indices))
        for idx, row in unmatched.iterrows():
            MLA.objects.update_or_create(
                member=row['Minister'],
                state_ut=row['State/UT'],
                defaults={
                    'is_minister': 'Yes',
                    'portfolio': row.get('Portfolio'),
                    'is_chief_minister': row.get('Is Chief Minister', 'No'),
                    'party': row.get('Party'),
                    'constituency': row.get('Constituency')
                }
            )
            scraped_count += 1
            
    return JsonResponse({'status': 'success', 'message': f'Scraped and saved {scraped_count} MLA/Ministers records.'})

@api_view(['POST', 'GET'])
def scrape_loksabha(request):
    url = "https://sansad.in/api_ls/member/getMemberAttendanceMemberWise"
    params = {"loksabha": "18", "session": "7", "locale": "en"}
    
    scraped_count = 0
    try:
        response = requests.get(url, params=params, headers=headers)
        if response.status_code == 200:
            for item in response.json():
                LokSabhaAttendance.objects.update_or_create(
                    member_name=item.get('memberName', ''),
                    defaults={
                        'mpsno': item.get('mpsno'),
                        'constituency': item.get('constituency'),
                        'state': item.get('state'),
                        'state_code': item.get('stateCode'),
                        'signed_days_count': item.get('signedDaysCount', 0),
                        'division': item.get('division')
                    }
                )
                scraped_count += 1
    except Exception:
        pass
        
    return JsonResponse({'status': 'success', 'message': f'Scraped and saved {scraped_count} Lok Sabha attendance records.'})

@api_view(['POST', 'GET'])
def scrape_rajyasabha(request):
    url = "https://integration.rajyasabha.digital/api-ext/api/v1/attendance/memberattendance"
    params = {"session": "270"}
    auth_headers = headers.copy()
    auth_headers["Authorization"] = "Bearer Y0hKaFltaGhkQzVyYVhKaGJn"
    
    scraped_count = 0
    try:
        response = requests.get(url, params=params, headers=auth_headers)
        if response.status_code == 200:
            for item in response.json():
                RajyaSabhaAttendance.objects.update_or_create(
                    name=item.get('name', ''),
                    defaults={
                        'session_no': item.get('sessionno'),
                        'mpsno': item.get('mpsno'),
                        'div_no': item.get('divno'),
                        'state_code': item.get('C_MP_STATE_CODE'),
                        'no_of_sittings': item.get('noofsittings', 0)
                    }
                )
                scraped_count += 1
    except Exception:
        pass
        
    return JsonResponse({'status': 'success', 'message': f'Scraped and saved {scraped_count} Rajya Sabha attendance records.'})

@api_view(['GET'])
def get_bills(request):
    bills = list(Bill.objects.all().values())
    return JsonResponse({'status': 'success', 'data': bills})

@api_view(['GET'])
def get_mla(request):
    mlas = list(MLA.objects.all().values())
    return JsonResponse({'status': 'success', 'data': mlas})

@api_view(['GET'])
def get_loksabha(request):
    loksabha = list(LokSabhaAttendance.objects.all().values())
    return JsonResponse({'status': 'success', 'data': loksabha})

@api_view(['GET'])
def get_rajyasabha(request):
    rajyasabha = list(RajyaSabhaAttendance.objects.all().values())
    return JsonResponse({'status': 'success', 'data': rajyasabha})

@api_view(['GET'])
def get_all(request):
    bills = list(Bill.objects.all().values())
    mlas = list(MLA.objects.all().values())
    loksabha = list(LokSabhaAttendance.objects.all().values())
    rajyasabha = list(RajyaSabhaAttendance.objects.all().values())
    return JsonResponse({
        'status': 'success',
        'data': {
            'bills': bills,
            'mlas': mlas,
            'loksabha': loksabha,
            'rajyasabha': rajyasabha
        }
    })

@api_view(['POST', 'GET'])
def scrape_governors(request):
    url = "https://en.wikipedia.org/wiki/List_of_current_Indian_governors"
    scraped_count = 0
    try:
        r = requests.get(url, headers=headers)
        if r.status_code == 200:
            soup = BeautifulSoup(r.text, 'html.parser')
            table = soup.find('table', class_='wikitable')
            if table:
                df_list = pd.read_html(io.StringIO(str(table)))
                if df_list:
                    df = df_list[0]
                    df.columns = [str(c).lower().strip() for c in df.columns]
                    state_col = next((c for c in df.columns if 'state' in c or 'union territory' in c), None)
                    gov_col = next((c for c in df.columns if 'governor' in c or 'name' in c or 'officeholder' in c), None)
                    took_office_col = next((c for c in df.columns if 'took' in c or 'office' in c or 'assumed' in c), None)

                    
                    for idx, row in df.iterrows():
                        state = str(row[state_col]).strip() if state_col and pd.notna(row[state_col]) else ""
                        gov = str(row[gov_col]).strip() if gov_col and pd.notna(row[gov_col]) else ""
                        took_office = str(row[took_office_col]).strip() if took_office_col and pd.notna(row[took_office_col]) else ""
                        
                        state = re.sub(r'\[.*?\]', '', state)
                        gov = re.sub(r'\[.*?\]', '', gov)
                        took_office = re.sub(r'\[.*?\]', '', took_office)
                        
                        if state and gov:
                            Governor.objects.update_or_create(
                                state=state,
                                defaults={
                                    'governor_name': gov,
                                    'took_office': took_office
                                }
                            )
                            scraped_count += 1
    except Exception:
        pass
    return JsonResponse({'status': 'success', 'message': f'Scraped and saved {scraped_count} governors.'})

@api_view(['GET'])
def get_state_list(request):
    states = list(MLA.objects.values_list('state_ut', flat=True).distinct())
    return JsonResponse({'status': 'success', 'data': states})

@api_view(['GET'])
def get_state_data(request, state_name=None):
    # Support both path param and query param ?state=
    name = state_name or request.GET.get('state')
    if not name:
        return JsonResponse({'status': 'error', 'message': 'state parameter is required.'}, status=400)
    
    mlas = list(MLA.objects.filter(state_ut__icontains=name).values())
    governors = list(Governor.objects.filter(state__icontains=name).values())
    return JsonResponse({
        'status': 'success',
        'data': {
            'state': name,
            'mlas': mlas,
            'governors': governors
        }
    })

@api_view(['GET'])
def get_governors(request):
    state_filter = request.GET.get('state')
    if state_filter:
        govs = list(Governor.objects.filter(state__icontains=state_filter).values())
    else:
        govs = list(Governor.objects.all().values())
    return JsonResponse({'status': 'success', 'data': govs})

@api_view(['GET'])
def get_attendance(request):
    loksabha = list(LokSabhaAttendance.objects.all().values())
    rajyasabha = list(RajyaSabhaAttendance.objects.all().values())
    return JsonResponse({
        'status': 'success',
        'data': {
            'loksabha': loksabha,
            'rajyasabha': rajyasabha
        }
    })

@api_view(['GET'])
def get_attendance_person(request):
    name = request.GET.get('name')
    if not name:
        return JsonResponse({'status': 'error', 'message': 'name parameter is required.'}, status=400)
    
    loksabha = list(LokSabhaAttendance.objects.filter(member_name__icontains=name).values())
    rajyasabha = list(RajyaSabhaAttendance.objects.filter(name__icontains=name).values())
    return JsonResponse({
        'status': 'success',
        'data': {
            'search_name': name,
            'loksabha': loksabha,
            'rajyasabha': rajyasabha
        }
    })


