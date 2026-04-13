from typing import Any


class GroqScoringAgent:
    def __init__(self, api_key: str):
        self.api_key = api_key

    async def score_application_for_program(self, application_data: dict[str, Any], program_data: dict[str, Any]) -> dict:
        text_blob = " ".join(
            [
                application_data.get("problem_statement", ""),
                application_data.get("solution_description", ""),
                application_data.get("traction", ""),
                application_data.get("team_background", ""),
            ]
        )
        text_quality = min(100, max(40, len(text_blob) // 12))
        social = min(100, max(0, int(application_data.get("social_impact_score", 0) * 10)))
        base = max(45, min(90, (text_quality + social) // 2))
        fit_bump = 8 if "women" in program_data.get("name", "").lower() else 0
        fit_score = min(95, base + fit_bump)

        return {
            "score_problem_clarity": base,
            "score_solution_viability": min(95, base + 4),
            "score_market_potential": min(95, base + 2),
            "score_team_strength": min(95, base + 1),
            "score_traction": max(35, base - 3),
            "score_social_impact": social,
            "program_fit_score": fit_score,
            "reasoning": "Heuristic score generated in local mode. Replace with Groq API call for production scoring.",
        }
