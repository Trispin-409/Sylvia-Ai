"""Google Search-grounded opportunity discovery for Sylvia's Google ADK backend.

Copy this module into the existing backend as app/opportunity_discovery.py.
It does not replace Sylvia's existing memory, evidence, Decision DNA, Gmail,
Calendar, root-agent, or session configuration.

Trust rule: results are marked search_result_only until a page-verification
step actually fetches and checks the source page. Opportunity rows are retained
only when their source URL matches a URL in Google's grounding metadata.
"""
from __future__ import annotations

import hashlib
import json
import logging
import os
import re
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlparse

logger = logging.getLogger(__name__)
DEFAULT_SEARCH_MODEL = "gemini-3.8-flash"
ALLOWED_OPPORTUNITY_TYPES = {
    "job", "internship", "learnership", "bursary", "training",
    "mentorship", "micro_project", "other",
}


class SearchConfigurationError(RuntimeError):
    """Raised when Google Search grounding is not configured."""


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def _get(value: Any, *names: str, default: Any = None) -> Any:
    """Read an SDK model attribute or dictionary key without depending on its class."""
    for name in names:
        if isinstance(value, dict) and name in value:
            return value[name]
        candidate = getattr(value, name, None)
        if candidate is not None:
            return candidate
    return default


def _is_http_url(value: Any) -> bool:
    if not isinstance(value, str) or len(value) > 2048:
        return False
    parsed = urlparse(value.strip())
    return (
        parsed.scheme in {"https", "http"}
        and bool(parsed.netloc)
        and not parsed.username
        and not parsed.password
    )


def _url_key(value: str) -> tuple[str, str] | None:
    """Canonical comparison key; callers always return the original grounded URL."""
    if not _is_http_url(value):
        return None
    parsed = urlparse(value.strip())
    host = (parsed.hostname or "").lower().rstrip(".")
    path = re.sub(r"/{2,}", "/", parsed.path or "/").rstrip("/") or "/"
    if not host:
        return None
    return host, path


def _grounded_sources(response: Any) -> tuple[list[dict[str, str]], Any, list[str]]:
    candidates = _get(response, "candidates", default=[]) or []
    candidate = candidates[0] if candidates else None
    metadata = _get(candidate, "grounding_metadata", "groundingMetadata") if candidate else None
    chunks = _get(metadata, "grounding_chunks", "groundingChunks", default=[]) or []

    sources: list[dict[str, str]] = []
    seen: set[str] = set()
    for chunk in chunks:
        web = _get(chunk, "web", default=chunk)
        uri = _get(web, "uri", "url")
        title = _get(web, "title", default="Source page") or "Source page"
        if not _is_http_url(uri):
            continue
        key = uri.strip()
        if key in seen:
            continue
        seen.add(key)
        sources.append({"title": str(title)[:240], "url": key})

    raw_queries = _get(metadata, "web_search_queries", "webSearchQueries", default=[]) or []
    queries = [str(item)[:300] for item in raw_queries if item]
    search_entry_point = _get(metadata, "search_entry_point", "searchEntryPoint")
    rendered_html = _get(search_entry_point, "rendered_content", "renderedContent") if search_entry_point else None
    return sources, rendered_html, queries


def _parse_json_object(text: str) -> dict[str, Any] | None:
    if not isinstance(text, str) or not text.strip():
        return None
    candidate = text.strip()
    candidate = re.sub(r"^\x60{3}(?:json)?\s*", "", candidate, flags=re.IGNORECASE)
    candidate = re.sub(r"\s*\x60{3}$", "", candidate)
    try:
        parsed = json.loads(candidate)
    except json.JSONDecodeError:
        start = candidate.find("{")
        end = candidate.rfind("}")
        if start < 0 or end <= start:
            return None
        try:
            parsed = json.loads(candidate[start : end + 1])
        except json.JSONDecodeError:
            return None
    return parsed if isinstance(parsed, dict) else None


def _match_grounded_url(value: Any, sources: list[dict[str, str]]) -> str | None:
    """Return a URL from grounding metadata, never the model's raw URL."""
    if not isinstance(value, str):
        return None
    candidate_key = _url_key(value)
    if candidate_key is None:
        return None
    for source in sources:
        if _url_key(source["url"]) == candidate_key:
            return source["url"]
    return None


def _build_client() -> Any:
    """Use Vertex AI/ADC first; allow a Gemini API key for local development."""
    project = (
        os.getenv("GOOGLE_CLOUD_PROJECT")
        or os.getenv("GCP_PROJECT")
        or os.getenv("GCLOUD_PROJECT")
    )
    api_key = os.getenv("GEMINI_API_KEY")

    try:
        from google import genai
    except ImportError as exc:
        raise SearchConfigurationError(
            "The google-genai package is missing. Install/update it in the ADK environment."
        ) from exc

    if project:
        location = os.getenv("GOOGLE_CLOUD_LOCATION") or os.getenv("VERTEX_LOCATION") or "global"
        return genai.Client(vertexai=True, project=project, location=location)
    if api_key:
        return genai.Client(api_key=api_key)

    raise SearchConfigurationError(
        "Live search is not configured. Set GOOGLE_CLOUD_PROJECT and grant the Cloud Run "
        "service account Vertex AI access, or set GEMINI_API_KEY for local development."
    )


def _generate_grounded_response(client: Any, model: str, prompt: str) -> Any:
    """Make one Gemini generation call with the Google Search grounding tool."""
    try:
        from google.genai import types
    except ImportError as exc:
        raise SearchConfigurationError(
            "The google-genai package is missing. Install/update it in the ADK environment."
        ) from exc

    return client.models.generate_content(
        model=model,
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.1,
            max_output_tokens=4096,
            tools=[types.Tool(google_search=types.GoogleSearch())],
        ),
    )


def _normalise_opportunity(
    item: Any, sources: list[dict[str, str]], checked_at: str
) -> dict[str, Any] | None:
    if not isinstance(item, dict):
        return None

    source_url = _match_grounded_url(item.get("source_url"), sources)
    if not source_url:
        return None

    title = str(item.get("title") or "").strip()[:240]
    summary = str(item.get("summary") or "").strip()[:700]
    if not title or not summary:
        return None

    kind = str(item.get("opportunity_type") or "other").strip().lower()
    if kind not in ALLOWED_OPPORTUNITY_TYPES:
        kind = "other"

    application_url = _match_grounded_url(item.get("application_url"), sources)
    source_title = next((s["title"] for s in sources if s["url"] == source_url), "Source page")

    return {
        "id": "opportunity-" + hashlib.sha256(
            f"{title.casefold()}|{source_url}".encode("utf-8")
        ).hexdigest()[:16],
        "title": title,
        "summary": summary,
        "opportunity_type": kind,
        "location": str(item.get("location") or "Not stated in search evidence")[:180],
        "work_mode": str(item.get("work_mode") or "Not stated")[:80],
        "eligibility": str(item.get("eligibility") or "Check the source page")[:500],
        "deadline": str(item.get("deadline") or "Not verified")[:100],
        "paid_status": str(item.get("paid_status") or "Not verified")[:80],
        "source_title": source_title,
        "source_url": source_url,
        "application_url": application_url,
        "last_checked_at": checked_at,
        "verification_status": "search_result_only",
        "page_checked": False,
        "availability_status": "unknown",
        "evidence_note": (
            "Discovered through Google Search grounding. The source page and current "
            "availability have not been independently checked."
        ),
    }


def search_live_opportunities(
    query: str,
    location: str = "South Africa",
    opportunity_types: str = "jobs, internships, learnerships, bursaries, training, mentorship",
    limit: int = 6,
) -> dict[str, Any]:
    """Find public youth-work and career leads using live Google Search grounding.

    This is intended to be exposed as a normal Google ADK function tool. It does
    not apply for jobs or claim a listing is open. Verification is a separate step.
    """
    checked_at = _utc_now()
    enabled = os.getenv("SYLVIA_LIVE_OPPORTUNITY_SEARCH_ENABLED", "true").strip().lower()
    if enabled in {"0", "false", "no", "off"}:
        return {
            "success": False, "status": "disabled", "query": str(query or "")[:200],
            "last_checked_at": checked_at, "opportunities": [], "sources": [],
            "message": "Live opportunity search is disabled by configuration.",
        }

    if not isinstance(query, str) or not query.strip() or len(query.strip()) < 3:
        return {
            "success": False, "status": "invalid_query", "last_checked_at": checked_at,
            "opportunities": [], "sources": [],
            "message": "Provide a specific search query of at least 3 characters.",
        }

    query = query.strip()[:300]
    location = str(location or "South Africa").strip()[:160] or "South Africa"
    opportunity_types = str(opportunity_types or "jobs and youth career opportunities").strip()[:250]
    try:
        requested_limit = int(limit)
    except (TypeError, ValueError):
        requested_limit = 6
    requested_limit = min(max(requested_limit, 1), 8)

    prompt = f"""Search the current public web using Google Search for youth employment and work-readiness opportunities.
Search intent: {query}
Target geography: {location}
Opportunity categories: {opportunity_types}
Return at most {requested_limit} distinct, relevant opportunity candidates.

Rules:
- Use live Search results, not remembered or invented listings.
- Return one JSON object and no Markdown, with this schema:
  {{"summary": string, "opportunities": [{{"title": string, "summary": string, "opportunity_type": "job|internship|learnership|bursary|training|mentorship|micro_project|other", "location": string|null, "work_mode": string|null, "eligibility": string|null, "deadline": string|null, "paid_status": string|null, "source_url": string, "application_url": string|null}}]}}
- source_url MUST be the URL of a page actually found in this search. Do not invent or rewrite URLs.
- application_url may only be included when explicitly supported by a result; otherwise use null.
- Use null for facts not stated by the evidence. Never infer that an opportunity is paid, still open, or accepting applications unless evidence explicitly says so.
- Prefer official employer, government, university, programme or provider sources.
- Exclude duplicates, generic homepages without a relevant opportunity, and clearly expired results.
- The calling application checks source_url against Google's grounding metadata. Do not claim page verification.
"""

    try:
        client = _build_client()
        model = os.getenv("SYLVIA_SEARCH_MODEL") or os.getenv("MODEL") or DEFAULT_SEARCH_MODEL
        response = _generate_grounded_response(client, model, prompt)
        sources, search_entry_point_html, web_search_queries = _grounded_sources(response)
        response_text = _get(response, "text", default="") or ""
        parsed = _parse_json_object(str(response_text))

        if not sources:
            return {
                "success": False, "status": "no_grounding_sources", "query": query,
                "location": location, "search_provider": "Google Search grounding",
                "model": model, "last_checked_at": checked_at, "opportunities": [],
                "sources": [], "web_search_queries": web_search_queries,
                "search_entry_point_html": search_entry_point_html,
                "message": "No usable grounded source URLs were returned. No opportunities were reported.",
            }

        raw_items = parsed.get("opportunities", []) if parsed else []
        if not isinstance(raw_items, list):
            raw_items = []

        opportunities: list[dict[str, Any]] = []
        seen: set[tuple[str, str]] = set()
        rejected_unmatched = 0
        for raw_item in raw_items:
            opportunity = _normalise_opportunity(raw_item, sources, checked_at)
            if opportunity is None:
                rejected_unmatched += 1
                continue
            key = (opportunity["title"].casefold(), opportunity["source_url"])
            if key in seen:
                continue
            seen.add(key)
            opportunities.append(opportunity)
            if len(opportunities) >= requested_limit:
                break

        summary = str(parsed.get("summary") or "")[:700] if parsed else ""
        if opportunities:
            status = "results_found"
            message = "Search candidates found. These are search-result leads, not confirmed open opportunities."
        elif parsed is None:
            status = "sources_found_structuring_failed"
            message = (
                "Google Search returned sources, but the opportunity list could not be safely structured. "
                "Review the sources directly; no listings were fabricated."
            )
        else:
            status = "sources_found_no_valid_opportunities"
            message = "Sources were found, but no opportunity passed source-validation checks. Review the sources directly."

        return {
            "success": True, "status": status, "query": query, "location": location,
            "search_provider": "Google Search grounding", "model": model,
            "last_checked_at": checked_at, "summary": summary,
            "opportunities": opportunities, "sources": sources,
            "web_search_queries": web_search_queries,
            "search_entry_point_html": search_entry_point_html,
            "discarded_items_without_grounded_source": rejected_unmatched,
            "verification_note": (
                "A search result is not proof that a listing is still open. "
                "Source pages have not yet been independently fetched or checked."
            ),
            "message": message,
        }
    except SearchConfigurationError as exc:
        return {
            "success": False, "status": "configuration_error", "query": query,
            "location": location, "last_checked_at": checked_at, "opportunities": [],
            "sources": [], "message": str(exc),
        }
    except Exception as exc:
        logger.exception("Sylvia live opportunity search failed")
        return {
            "success": False, "status": "search_failed", "query": query,
            "location": location, "last_checked_at": checked_at, "opportunities": [],
            "sources": [],
            "message": f"Google Search grounding failed ({type(exc).__name__}). No opportunity results were generated.",
        }
