from decimal import Decimal
from typing import Any


def preference_score_for(program_id: Any, app: Any) -> tuple[int, Decimal]:
    rank_map = {
        app.preference_1: (3, Decimal(100)),
        app.preference_2: (2, Decimal(75)),
        app.preference_3: (1, Decimal(50)),
    }
    return rank_map.get(program_id, (0, Decimal(0)))


def final_score(program_score: Decimal, preference_score: Decimal) -> Decimal:
    return ((program_score * Decimal("0.7")) + (preference_score * Decimal("0.3"))).quantize(Decimal("0.01"))


def pick_winner(candidates: list[dict]) -> dict:
    preferred = [item for item in candidates if item["preference_rank"] > 0]
    source = preferred if preferred else candidates
    source = sorted(source, key=lambda row: row["final_score"], reverse=True)
    if len(source) > 1:
        lead = source[0]
        second = source[1]
        # If close (<5 points on 0-100 scale), emphasize preference.
        if abs(lead["final_score"] - second["final_score"]) < Decimal("5"):
            source = sorted(source, key=lambda row: (row["preference_rank"], row["final_score"]), reverse=True)
    source.sort(
        key=lambda row: (
            row["final_score"],
            row["preference_rank"],
            row["program_priority"],
            row["social_impact"],
            row.get("founder_strength", Decimal("0")),
            row["tier_boost"],
        ),
        reverse=True,
    )
    return source[0]

