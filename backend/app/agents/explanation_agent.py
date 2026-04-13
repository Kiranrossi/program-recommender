from decimal import Decimal
from typing import Any


class ExplanationAgent:
    """Step 4 agent: produce explainability text and reasons."""

    async def score_explanation(self, program: Any, score_parts: dict[str, Decimal], preference_rank: int) -> str:
        problem_fit = score_parts.get("problem_market_fit", score_parts.get("stage_fit", Decimal("0")))
        program_fit = score_parts.get("program_fit", score_parts.get("sector_fit", Decimal("0")))
        return (
            f"Selected for {program.name} with strong problem-market fit ({problem_fit}) "
            f"and program fit ({program_fit}). Preference rank contribution: {preference_rank}. "
            f"Social impact and geography bonus strengthened the final assignment."
        )

    async def selection_reasons(self, top_score_row: Any) -> list[str]:
        breakdown = top_score_row.score_breakdown or {}
        sector_fit = Decimal(str(breakdown.get("sector_fit", "0")))
        social_impact = Decimal(str(breakdown.get("social_impact", "0")))
        preference_score = Decimal(str(top_score_row.preference_score or 0))
        reasons: list[str] = []
        if sector_fit >= Decimal("70"):
            reasons.append("Strong sector fit")
        if social_impact >= Decimal("70"):
            reasons.append("High social impact")
        if preference_score >= Decimal("75"):
            reasons.append("Preference alignment")
        if not reasons:
            reasons.append("Overall weighted score advantage")
        return reasons

