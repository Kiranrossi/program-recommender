from decimal import Decimal
from typing import Any

from app.services.matching_service import final_score, preference_score_for
from app.services.scoring_engine import compute_program_score


class ScoringAgent:
    """Step 2 agent: compute per-program scores."""

    async def run(self, application: Any, program: Any, program_config: Any, features: dict[str, Any]) -> dict[str, Any]:
        score_parts = compute_program_score(features, application, program, program_config)
        pref_rank, pref_score = preference_score_for(program.id, application)
        combined_score = final_score(score_parts["program_score"], pref_score)
        return {
            "program_id": program.id,
            "program_priority": Decimal(str(getattr(program_config, "program_priority", 0))),
            "social_impact": score_parts["social_impact"],
            "founder_strength": score_parts["founder_strength"],
            "tier_boost": Decimal(5 if features.get("city_tier") in {"tier2", "tier3"} else 0),
            "preference_rank": pref_rank,
            "program_score": score_parts["program_score"],
            "preference_score": pref_score,
            "final_score": combined_score,
            "score_parts": score_parts,
        }

