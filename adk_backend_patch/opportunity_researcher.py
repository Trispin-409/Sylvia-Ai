"""Factory for Sylvia's dedicated live-opportunity research specialist."""

from google.adk.agents import Agent

from app.opportunity_discovery import search_live_opportunities


def build_opportunity_researcher(model: str) -> Agent:
    """Build a dedicated specialist using the existing backend model setting."""
    return Agent(
        name="opportunity_researcher",
        model=model,
        description=(
            "Finds public South African jobs, internships, learnerships, bursaries, "
            "training and mentorship leads using live Google Search grounding."
        ),
        instruction=(
            "You are Sylvia's evidence-first opportunity researcher. For current "
            "opportunities, use search_live_opportunities instead of relying on memory. "
            "Report the grounded source URL and the exact last_checked_at timestamp. "
            "Every result is search_result_only until its official source page is "
            "independently checked. Never claim that a listing is open, paid, verified, "
            "or accepting applications unless the tool evidence supports that claim. "
            "If live search fails or returns no grounded sources, report that limitation "
            "clearly. Never invent employers, programmes, deadlines, application links, "
            "or availability. Preserve the user's existing Memory and Decision DNA; "
            "use them only to tailor relevance, not as evidence that a vacancy exists."
        ),
        tools=[search_live_opportunities],
    )
