from typing import Any

from app.services.city_tier import classify_city_tier
from app.services.nlp_scoring import score_problem_and_company_text

STAGE_NUMERIC = {
    "idea": 1,
    "mvp": 2,
    "revenue": 3,
    "growth": 4,
}

SECTOR_ENCODING = {
    "healthcare": 1,
    "medtech": 2,
    "edtech": 3,
    "fintech": 4,
    "social": 5,
    "deeptech": 6,
    "agritech": 7,
    "consumer": 8,
}

def extract_features(application: Any) -> dict[str, Any]:
    stage = (application.stage or "idea").lower()
    sector = (application.sector or "general").lower()
    city_tier = classify_city_tier(application.city or "")
    company_description = application.solution_description or application.target_market or ""
    nlp_scores = score_problem_and_company_text(application.problem_statement or "", company_description)
    payload = getattr(application, "application_payload", None) or {}
    founder_payload = payload.get("founder", {}) if isinstance(payload, dict) else {}
    team_payload = payload.get("team", {}) if isinstance(payload, dict) else {}
    founder_signal = 0
    if founder_payload.get("prior_entrepreneurial_experience"):
        founder_signal += 25
    if founder_payload.get("linkedin"):
        founder_signal += 20
    if founder_payload.get("education"):
        founder_signal += 20
    if founder_payload.get("time_commitment"):
        founder_signal += 15
    founder_signal += min(20, int(application.team_size or 1) * 4)

    blended_social_impact_10 = round(
        (float(nlp_scores["problem_social_impact_10"]) * 0.45)
        + (float(nlp_scores["company_social_impact_10"]) * 0.45)
        + (float(application.social_impact_score or 0) * 0.10),
        2,
    )
    return {
        "stage_numeric": STAGE_NUMERIC.get(stage, 1),
        "stage_label": stage,
        "sector_encoded": SECTOR_ENCODING.get(sector, 0),
        "sector_label": sector,
        "city_tier": city_tier,
        "social_impact_nlp": blended_social_impact_10 * 10,
        "social_impact_nlp_10": blended_social_impact_10,
        "problem_social_impact_10": nlp_scores["problem_social_impact_10"],
        "company_social_impact_10": nlp_scores["company_social_impact_10"],
        "problem_sector_relevance_10": nlp_scores["problem_sector_relevance_10"],
        "company_sector_relevance_10": nlp_scores["company_sector_relevance_10"],
        "problem_predicted_sector": nlp_scores["problem_predicted_sector"],
        "company_predicted_sector": nlp_scores["company_predicted_sector"],
        "team_size": int(application.team_size or 1),
        "traction_text_length": len(application.traction or ""),
        "founder_strength_signal": max(0, min(100, founder_signal)),
        "cofounder_count": len(team_payload.get("cofounders", []) or []),
    }

