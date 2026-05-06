import csv
import logging
import re
from datetime import datetime
from typing import Dict, List, Optional
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup
from django.conf import settings

logger = logging.getLogger(__name__)

HANDLE_RE = re.compile(r"/handle/[^/]+/(\d+)")


def _extract_handle_id(url: str) -> Optional[int]:
    if not url:
        return None
    match = HANDLE_RE.search(url)
    if not match:
        return None
    try:
        return int(match.group(1))
    except ValueError:
        return None


def _derive_handle_prefix(rows: List[Dict[str, str]]) -> Optional[str]:
    for row in rows:
        url = row.get("View_Link") or ""
        if not url:
            continue
        parsed = urlparse(url)
        if not parsed.scheme or not parsed.netloc:
            continue
        path = parsed.path.rstrip("/")
        if "/" not in path:
            continue
        base_path = path.rsplit("/", 1)[0]
        return f"{parsed.scheme}://{parsed.netloc}{base_path}"
    return None


def _fetch_html(session: requests.Session, url: str) -> tuple[Optional[str], str, int]:
    def _try(target: str):
        try:
            res = session.get(target, timeout=20)
            return res
        except requests.RequestException as exc:
            logger.warning("Page fetch failed: %s", exc)
            return None

    res = _try(url)
    if res is None:
        return None, url, 0

    if res.status_code == 404 and "view_type=browse" in url:
        alternates = [
            url.replace("view_type=browse", "view_type=detail"),
            url.split("?", 1)[0],
        ]
        for alt in alternates:
            res_alt = _try(alt)
            if res_alt is None:
                continue
            if res_alt.status_code != 404:
                res = res_alt
                url = alt
                break

    if res.status_code >= 400:
        return None, url, res.status_code

    return res.text, res.url or url, res.status_code


def _meta_content(soup: BeautifulSoup, names: List[str]) -> Optional[str]:
    for name in names:
        tag = soup.find("meta", attrs={"name": name})
        if tag and tag.get("content"):
            return tag["content"]
        tag = soup.find("meta", attrs={"property": name})
        if tag and tag.get("content"):
            return tag["content"]
    return None


def _parse_metadata(html: str) -> Dict[str, str]:
    soup = BeautifulSoup(html, "html.parser")
    title = _meta_content(
        soup,
        ["DC.title", "DCTERMS.title", "dc.title", "dcterms.title"],
    )
    date = _meta_content(
        soup,
        [
            "DC.date.issued",
            "DCTERMS.issued",
            "dc.date.issued",
            "dcterms.issued",
        ],
    )
    doc_type = _meta_content(
        soup,
        ["DC.type", "DCTERMS.type", "dc.type", "dcterms.type"],
    )

    if not title:
        header = soup.find("h2", class_="page-header")
        if header:
            title = header.get_text(strip=True)

    if not title or not date or not doc_type:
        for row in soup.find_all("tr"):
            cells = row.find_all(["td", "th"])
            if len(cells) < 2:
                continue
            label = cells[0].get_text(" ", strip=True).lower()
            value = cells[1].get_text(" ", strip=True)
            if not value:
                continue

            if not title and "title" in label:
                title = value
            elif not date and "date" in label and "issued" in label:
                date = value
            elif not doc_type and "type" in label:
                doc_type = value

    return {
        "title": title or "",
        "date": date or "",
        "type": doc_type or "",
    }


def _parse_date(raw: str) -> Optional[datetime]:
    if not raw:
        return None
    raw = raw.strip()

    for fmt in (
        "%Y-%m-%d",
        "%Y/%m/%d",
        "%d-%b-%Y",
        "%d %b %Y",
        "%B %d, %Y",
        "%d %B %Y",
    ):
        try:
            return datetime.strptime(raw, fmt)
        except ValueError:
            continue
    return None


def _format_date(raw: str) -> str:
    dt = _parse_date(raw)
    if not dt:
        return raw.strip() if raw else ""
    return dt.strftime("%d-%b-%Y")


def _is_lok_sabha_debate(meta: Dict[str, str]) -> bool:
    title = (meta.get("title") or "").lower()
    if "lok sabha debates" not in title:
        return False
    return True


def update_index_csv() -> Dict[str, object]:
    index_csv = settings.PIPELINE_INDEX_CSV
    index_csv.parent.mkdir(parents=True, exist_ok=True)

    rows: List[Dict[str, str]] = []
    if index_csv.exists():
        with open(index_csv, newline="", encoding="utf-8") as f:
            rows = list(csv.DictReader(f))

    existing_links = {row.get("View_Link") for row in rows if row.get("View_Link")}
    existing_ids = {
        _extract_handle_id(row.get("View_Link") or "")
        for row in rows
        if row.get("View_Link")
    }
    existing_ids.discard(None)

    handle_prefix = settings.INGEST_HANDLE_PREFIX or _derive_handle_prefix(rows)
    if not handle_prefix:
        logger.warning("Unable to determine handle prefix. Skipping index refresh.")
        return {
            "added": 0,
            "total": len(rows),
            "status": "skipped",
            "reason": "handle_prefix_missing",
        }

    max_id = max(existing_ids) if existing_ids else 0
    scan_ahead = max(1, settings.INGEST_MAX_SCAN_AHEAD)
    max_misses = max(1, settings.INGEST_MAX_CONSECUTIVE_MISSES)

    try:
        import pipeline

        headers = pipeline.DEFAULT_HEADERS
    except Exception:
        headers = {"User-Agent": "Mozilla/5.0"}

    session = requests.Session()
    session.headers.update(headers)

    new_entries: List[Dict[str, str]] = []
    misses = 0

    for handle_id in range(max_id + 1, max_id + scan_ahead + 1):
        url = f"{handle_prefix}/{handle_id}?view_type=browse"
        html, effective_url, status_code = _fetch_html(session, url)

        if not html:
            misses += 1
            if misses >= max_misses:
                break
            continue

        meta = _parse_metadata(html)
        if not _is_lok_sabha_debate(meta):
            continue

        view_link = effective_url or url
        handle = _extract_handle_id(view_link)
        if handle in existing_ids or view_link in existing_links:
            continue

        row = {
            "Date": _format_date(meta.get("date") or ""),
            "Title": meta.get("title") or "Lok Sabha Debates (Uncorrected)",
            "Type": meta.get("type") or "Uncorrected",
            "View_Link": view_link,
        }
        new_entries.append(row)
        existing_ids.add(handle)
        existing_links.add(view_link)

    if not new_entries:
        return {"added": 0, "total": len(rows), "status": "ok"}

    combined = rows + new_entries

    def sort_key(row: Dict[str, str]) -> datetime:
        dt = _parse_date(row.get("Date") or "")
        return dt or datetime.min

    combined.sort(key=sort_key, reverse=True)

    with open(index_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["Date", "Title", "Type", "View_Link"])
        writer.writeheader()
        writer.writerows(combined)

    return {
        "added": len(new_entries),
        "total": len(combined),
        "status": "ok",
        "new_ids": [
            _extract_handle_id(entry.get("View_Link") or "") for entry in new_entries
        ],
    }
