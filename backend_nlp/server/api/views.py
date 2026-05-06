import json
from typing import Optional

from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.http import require_GET

from .db import get_connection

try:
    import pipeline

    CORE_VALUES = [v for v in pipeline.LABELS if v != "NONE"]
except Exception:
    CORE_VALUES = []


def _load_master_lok_sabha() -> list[dict]:
    """Load canonical Lok Sabha members list from pipeline raw data."""
    mp_list_file = settings.PIPELINE_MP_LIST
    if not mp_list_file.exists():
        return []

    out: list[dict] = []
    seen: set[str] = set()
    for raw_line in mp_list_file.read_text(encoding="utf-8").splitlines():
        line = (raw_line or "").strip()
        if not line:
            continue

        if " — " in line:
            name, constituency = line.split(" — ", 1)
        else:
            name, constituency = line, ""

        normalized_name = name.strip()
        if not normalized_name:
            continue

        key = normalized_name.lower()
        if key in seen:
            continue
        seen.add(key)

        out.append(
            {
                "id": normalized_name,
                "name": normalized_name,
                "constituency": constituency.strip(),
                "house": "lok_sabha",
            }
        )

    return out


def _parse_int(value: Optional[str], default: int, min_value: int = 0, max_value: int = 10000) -> int:
    if value is None or value == "":
        return default
    try:
        out = int(value)
    except ValueError:
        return default
    return max(min_value, min(out, max_value))


def _latest_batch_id(conn) -> Optional[str]:
    row = conn.execute(
        "SELECT batch_id FROM batches ORDER BY created_at DESC LIMIT 1"
    ).fetchone()
    if row:
        return row["batch_id"]
    return None


def _resolve_batch_id(conn, batch_param: Optional[str]) -> Optional[str]:
    if not batch_param or batch_param == "latest":
        return _latest_batch_id(conn)
    if batch_param == "all":
        return None
    return batch_param


@require_GET
def health(request):
    db_path = settings.PIPELINE_DB
    db_exists = db_path.exists()

    payload = {
        "status": "ok" if db_exists else "degraded",
        "db_path": str(db_path),
        "db_exists": db_exists,
    }

    status_code = 200 if db_exists else 503

    if db_exists:
        try:
            with get_connection() as conn:
                payload["counts"] = {
                    "scores": conn.execute("SELECT COUNT(*) FROM scores").fetchone()[0],
                    "evidence": conn.execute(
                        "SELECT COUNT(*) FROM score_evidence"
                    ).fetchone()[0],
                    "batches": conn.execute(
                        "SELECT COUNT(*) FROM batches"
                    ).fetchone()[0],
                }
                payload["latest_batch_id"] = _latest_batch_id(conn)
        except Exception as exc:
            payload["status"] = "degraded"
            payload["error"] = str(exc)
            status_code = 503

    status_file = settings.INGEST_STATUS_FILE
    if status_file.exists():
        try:
            payload["ingest"] = json.loads(status_file.read_text(encoding="utf-8"))
        except Exception:
            payload["ingest"] = {"status": "unavailable"}

    return JsonResponse(payload, status=status_code)


@require_GET
def core_values(request):
    values = []
    if settings.PIPELINE_DB.exists():
        with get_connection() as conn:
            rows = conn.execute(
                "SELECT DISTINCT core_value FROM scores ORDER BY core_value"
            ).fetchall()
            values = [r["core_value"] for r in rows]
    if not values:
        values = CORE_VALUES
    return JsonResponse({"core_values": values})


@require_GET
def batches(request):
    limit = _parse_int(request.GET.get("limit"), 50, 1, 500)
    offset = _parse_int(request.GET.get("offset"), 0, 0, 100000)

    if not settings.PIPELINE_DB.exists():
        return JsonResponse({"batches": [], "count": 0})

    with get_connection() as conn:
        rows = conn.execute(
            "SELECT batch_id, created_at, start_date, end_date, source_count "
            "FROM batches ORDER BY created_at DESC LIMIT ? OFFSET ?",
            (limit, offset),
        ).fetchall()
        total = conn.execute("SELECT COUNT(*) FROM batches").fetchone()[0]

    return JsonResponse(
        {
            "batches": [dict(row) for row in rows],
            "count": total,
            "limit": limit,
            "offset": offset,
        }
    )


@require_GET
def list_mps(request):
    q = (request.GET.get("q") or "").strip()
    limit = _parse_int(request.GET.get("limit"), 100, 1, 1000)
    offset = _parse_int(request.GET.get("offset"), 0, 0, 100000)

    master_mps = _load_master_lok_sabha()

    if not settings.PIPELINE_DB.exists() and not master_mps:
        return JsonResponse({"mps": [], "count": 0})

    score_map: dict[str, dict] = {}
    if settings.PIPELINE_DB.exists():
        with get_connection() as conn:
            score_rows = conn.execute(
                "SELECT mp_name, SUM(score) AS total_score, COUNT(*) AS score_rows "
                "FROM scores GROUP BY mp_name"
            ).fetchall()
            for row in score_rows:
                key = (row["mp_name"] or "").strip().lower()
                if key:
                    score_map[key] = {
                        "name": (row["mp_name"] or "").strip(),
                        "total_score": float(row["total_score"] or 0.0),
                        "score_rows": int(row["score_rows"] or 0),
                    }

    if master_mps:
        mps = []
        for mp in master_mps:
            key = mp["name"].lower()
            score_data = score_map.get(key, {"total_score": 0.0, "score_rows": 0})
            mps.append(
                {
                    **mp,
                    "party": "Unknown",
                    "state": "",
                    "has_scores": score_data["score_rows"] > 0,
                    "total_score": score_data["total_score"],
                    "score_rows": score_data["score_rows"],
                }
            )
    else:
        mps = [
            {
                "id": key,
                "name": meta["name"],
                "constituency": "",
                "house": "lok_sabha",
                "party": "Unknown",
                "state": "",
                "has_scores": True,
                "total_score": meta["total_score"],
                "score_rows": meta["score_rows"],
            }
            for key, meta in score_map.items()
        ]

    if q:
        q_lower = q.lower()
        mps = [
            mp
            for mp in mps
            if q_lower in mp["name"].lower()
            or q_lower in (mp.get("constituency") or "").lower()
        ]

    total = len(mps)
    rows = mps[offset : offset + limit]

    return JsonResponse(
        {
            "mps": rows,
            "count": total,
            "limit": limit,
            "offset": offset,
        }
    )


@require_GET
def mp_scores(request, mp_name: str):
    core_value = (request.GET.get("core_value") or "").strip()
    batch_param = (request.GET.get("batch") or "latest").strip()

    if not settings.PIPELINE_DB.exists():
        return JsonResponse({"error": "pipeline db missing"}, status=503)

    with get_connection() as conn:
        batch_id = _resolve_batch_id(conn, batch_param)
        if batch_param != "all" and not batch_id:
            return JsonResponse({"error": "no batches available"}, status=404)

        params = [mp_name]
        sql = (
            "SELECT core_value, SUM(score) AS score FROM scores "
            "WHERE LOWER(mp_name) = LOWER(?)"
        )

        if batch_id:
            sql += " AND batch_id = ?"
            params.append(batch_id)

        if core_value:
            sql += " AND LOWER(core_value) = LOWER(?)"
            params.append(core_value)

        sql += " GROUP BY core_value ORDER BY core_value"

        rows = conn.execute(sql, tuple(params)).fetchall()

    if not rows:
        return JsonResponse({"error": "mp not found"}, status=404)

    scores = {row["core_value"]: row["score"] for row in rows}
    payload = {
        "mp_name": mp_name,
        "batch": batch_param if batch_param else "latest",
        "batch_id": batch_id,
        "core_values_score": scores,
        "total_score": sum(scores.values()),
    }

    return JsonResponse(payload)


@require_GET
def mp_evidence(request, mp_name: str):
    core_value = (request.GET.get("core_value") or "").strip()
    batch_param = (request.GET.get("batch") or "latest").strip()
    include_speech = (request.GET.get("include_speech") or "1").lower() in {
        "1",
        "true",
        "yes",
    }
    limit = _parse_int(request.GET.get("limit"), 100, 1, 1000)
    offset = _parse_int(request.GET.get("offset"), 0, 0, 100000)

    if not settings.PIPELINE_DB.exists():
        return JsonResponse({"error": "pipeline db missing"}, status=503)

    with get_connection() as conn:
        batch_id = _resolve_batch_id(conn, batch_param)
        if batch_param != "all" and not batch_id:
            return JsonResponse({"error": "no batches available"}, status=404)

        params = [mp_name]
        fields = "batch_id, core_value, score, row_index"
        if include_speech:
            fields += ", speech"

        sql = (
            f"SELECT {fields} FROM score_evidence "
            "WHERE LOWER(mp_name) = LOWER(?)"
        )

        if batch_id:
            sql += " AND batch_id = ?"
            params.append(batch_id)

        if core_value:
            sql += " AND LOWER(core_value) = LOWER(?)"
            params.append(core_value)

        sql += " ORDER BY score DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        rows = conn.execute(sql, tuple(params)).fetchall()

    evidence = [dict(row) for row in rows]

    return JsonResponse(
        {
            "mp_name": mp_name,
            "batch": batch_param if batch_param else "latest",
            "batch_id": batch_id,
            "core_value": core_value or None,
            "count": len(evidence),
            "limit": limit,
            "offset": offset,
            "evidence": evidence,
        }
    )


@require_GET
def mp_core_summary(request, mp_name: str, core_value: str):
    batch_param = (request.GET.get("batch") or "latest").strip()
    include_speech = (request.GET.get("include_speech") or "1").lower() in {
        "1",
        "true",
        "yes",
    }
    limit = _parse_int(request.GET.get("limit"), 50, 1, 1000)
    offset = _parse_int(request.GET.get("offset"), 0, 0, 100000)

    if not settings.PIPELINE_DB.exists():
        return JsonResponse({"error": "pipeline db missing"}, status=503)

    with get_connection() as conn:
        batch_id = _resolve_batch_id(conn, batch_param)
        if batch_param != "all" and not batch_id:
            return JsonResponse({"error": "no batches available"}, status=404)

        params = [mp_name, core_value]
        sql = (
            "SELECT SUM(score) AS score FROM scores "
            "WHERE LOWER(mp_name) = LOWER(?) AND LOWER(core_value) = LOWER(?)"
        )
        if batch_id:
            sql += " AND batch_id = ?"
            params.append(batch_id)

        score_row = conn.execute(sql, tuple(params)).fetchone()
        score_value = score_row["score"] if score_row else None

        if score_value is None:
            return JsonResponse({"error": "mp/core_value not found"}, status=404)

        ev_params = [mp_name, core_value]
        fields = "batch_id, core_value, score, row_index"
        if include_speech:
            fields += ", speech"
        ev_sql = (
            f"SELECT {fields} FROM score_evidence "
            "WHERE LOWER(mp_name) = LOWER(?) AND LOWER(core_value) = LOWER(?)"
        )
        if batch_id:
            ev_sql += " AND batch_id = ?"
            ev_params.append(batch_id)
        ev_sql += " ORDER BY score DESC LIMIT ? OFFSET ?"
        ev_params.extend([limit, offset])

        evidence = [dict(row) for row in conn.execute(ev_sql, tuple(ev_params)).fetchall()]

    return JsonResponse(
        {
            "mp_name": mp_name,
            "core_value": core_value,
            "score": score_value,
            "batch": batch_param if batch_param else "latest",
            "batch_id": batch_id,
            "count": len(evidence),
            "limit": limit,
            "offset": offset,
            "evidence": evidence,
        }
    )


@require_GET
def ingest_status(request):
    status_file = settings.INGEST_STATUS_FILE
    if not status_file.exists():
        return JsonResponse({"status": "unavailable"}, status=404)

    try:
        data = json.loads(status_file.read_text(encoding="utf-8"))
    except Exception as exc:
        return JsonResponse({"status": "error", "error": str(exc)}, status=500)

    return JsonResponse(data)


@require_GET
def mp_speeches(request, mp_name: str):
    batch_param = (request.GET.get("batch") or "latest").strip()
    limit = _parse_int(request.GET.get("limit"), 100, 1, 1000)
    offset = _parse_int(request.GET.get("offset"), 0, 0, 100000)

    if not settings.PIPELINE_DB.exists():
        return JsonResponse({"error": "pipeline db missing"}, status=503)

    with get_connection() as conn:
        batch_id = _resolve_batch_id(conn, batch_param)
        if batch_param != "all" and not batch_id:
            return JsonResponse({"error": "no batches available"}, status=404)

        filter_params = [mp_name]
        # JOIN with batches table to include date metadata
        base_sql = (
            "SELECT se.batch_id, se.core_value, se.score, se.row_index, se.speech, "
            "b.start_date, b.end_date FROM score_evidence se "
            "LEFT JOIN batches b ON se.batch_id = b.batch_id "
            "WHERE LOWER(se.mp_name) = LOWER(?)"
        )

        if batch_id:
            base_sql += " AND se.batch_id = ?"
            filter_params.append(batch_id)

        count_sql = (
            "SELECT COUNT(*) FROM score_evidence se "
            "WHERE LOWER(se.mp_name) = LOWER(?)"
        )
        if batch_id:
            count_sql += " AND se.batch_id = ?"

        total_count = conn.execute(count_sql, tuple(filter_params)).fetchone()[0]

        paged_sql = (
            base_sql
            + " ORDER BY se.score DESC, se.batch_id DESC, se.row_index DESC, se.id DESC"
            + " LIMIT ? OFFSET ?"
        )
        page_params = [*filter_params, limit, offset]

        rows = conn.execute(paged_sql, tuple(page_params)).fetchall()

    speeches = [dict(row) for row in rows]

    return JsonResponse(
        {
            "mp_name": mp_name,
            "batch": batch_param if batch_param else "latest",
            "batch_id": batch_id,
            "count": total_count,
            "returned_count": len(speeches),
            "limit": limit,
            "offset": offset,
            "speeches": speeches,
        }
    )
