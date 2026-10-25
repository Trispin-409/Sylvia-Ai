# Sylvia ADK — Live Opportunity Discovery

This folder is an integration-ready patch for the separate Python Google ADK backend. It is not a replacement for the React gateway or Sylvia's existing backend. It does not replace Memory, Evidence, Decision DNA, Gmail, Calendar, session management or confirmation flows.

## What this adds

- Calls Gemini with Google's live Search grounding tool.
- Preserves the source URLs and search query metadata returned in Google grounding metadata.
- Rejects any structured opportunity whose source URL does not match a grounded URL.
- Returns a UTC last-checked timestamp, source URL and conservative status fields.
- Marks every candidate as search_result_only, page_checked=false and availability_status=unknown.
- Returns Google-provided search-entry-point HTML when the SDK supplies it, so the Companion can render the required Search suggestions.
- Fails closed. Missing credentials, malformed model output, missing grounded sources and service errors produce an error/status result—not fake listings.

This initial step does not visit the source page itself. The timestamp is when Google Search grounding ran, not when the employer posted the opportunity. A separate, permitted page-verification stage is needed before any vacancy can be shown as open or verified.

## Wire it into the existing ADK backend

1. Copy opportunity_discovery.py into the existing backend as app/opportunity_discovery.py (the backend containing app/agent.py).
2. Confirm google-genai is installed in the same Python environment used by the ADK service.
3. Add this import to the existing app/agent.py:

   from app.opportunity_discovery import search_live_opportunities

4. Expose search_live_opportunities as a normal custom function tool to the existing Sylvia root agent or to a dedicated opportunity-research specialist. Extend the existing tools list; do not recreate or replace the root agent, current subagents, callbacks, session service, Memory, Evidence or Decision DNA configuration.
5. Deploy using the existing ADK backend deployment workflow.

Recommended researcher instructions:

Use search_live_opportunities for current public jobs, internships, learnerships, bursaries, training and mentorship leads. Present the source URL and exact last_checked_at time. Always say results are search_result_only until the official source page is checked. Never claim a vacancy is open, paid, verified or accepting applications unless tool evidence supports that specific claim. If search fails, say it failed; never fill the gap with remembered or invented listings.

## Configuration

Preferred Cloud Run configuration: use the existing service account with Application Default Credentials and Vertex AI permissions.

- GOOGLE_CLOUD_PROJECT: set to the deployed ADK project's ID (for example, sylvia-ai-506800 if that is still the active project).
- GOOGLE_CLOUD_LOCATION: global, or another location where the chosen model and grounding are supported.
- SYLVIA_SEARCH_MODEL: a Google Search-grounding-compatible Gemini model enabled for that project; the code defaults to gemini-3.8-flash.
- SYLVIA_LIVE_OPPORTUNITY_SEARCH_ENABLED: true to enable; false to disable.

For local development, GEMINI_API_KEY is also supported. Never commit API keys, OAuth tokens or service-account credentials to GitHub. Confirm model availability, billing, quota and regional support in Google Cloud before relying on live requests.

## SA Youth connector

No SA Youth endpoint has been hard-coded. The public developer portal describes partner API/webhook access, but the actual authenticated API contract and credentials were not provided. Once partner access is granted, add a separate adapter from the approved documentation, with its own response schema, timestamps, consent rules and tests. Do not scrape SA Youth or present Google-grounded public results as SA Youth API data.

## Offline tests

The unit tests mock the response from the external Google SDK; they test our source validation and failure handling without API calls. From this folder, run:

    python -m unittest discover -s tests -v

A separate live smoke test is still required in the configured ADK environment after the tool is wired in and deployed.

## Official references

- Gemini API: Grounding with Google Search — https://ai.google.dev/gemini-api/docs/google-search
- ADK Google Search Grounding — https://adk.dev/grounding/google_search_grounding/
- SA Youth Developer Portal — https://developers.sayouth.org.za/
