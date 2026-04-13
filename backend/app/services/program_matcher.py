def compute_weighted_total(scores: dict, weights: dict[str, float], tier2_bonus_enabled: bool) -> float:
    total = 0.0
    total += scores["score_problem_clarity"] * weights.get("problem_clarity", 0.15)
    total += scores["score_solution_viability"] * weights.get("solution_viability", 0.20)
    total += scores["score_market_potential"] * weights.get("market_potential", 0.15)
    total += scores["score_team_strength"] * weights.get("team_strength", 0.20)
    total += scores["score_traction"] * weights.get("traction", 0.15)
    total += scores["score_social_impact"] * weights.get("social_impact", 0.10)
    if tier2_bonus_enabled:
        total += 5.0
    return round(total, 2)
