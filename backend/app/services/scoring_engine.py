from decimal import Decimal
from typing import Any

from app.config import settings
from app.models.program_config import ProgramConfig


def _score_stage_fit(features: dict[str, Any], program: Any) -> Decimal:
    criteria = program.criteria or {}
    target_stage = str(criteria.get("stage", "idea")).lower()
    target_map = {"idea": 1, "mvp": 2, "revenue": 3, "growth": 4}
    distance = abs(features["stage_numeric"] - target_map.get(target_stage, 1))
    return Decimal(max(35, 100 - (distance * 25)))


def _score_sector_fit(features: dict[str, Any], program: Any) -> Decimal:
    name_blob = f"{program.name or ''} {program.description or ''}".lower()
    sector = features["sector_label"]
    predicted = str(features.get("company_predicted_sector", "general"))
    nlp_sector_relevance_10 = Decimal(str(features.get("company_sector_relevance_10", 0)))

    base = (nlp_sector_relevance_10 * Decimal(10)).quantize(Decimal("0.01"))
    if sector and sector != "general" and sector in name_blob:
        base += Decimal(10)
    if predicted != "general" and predicted in name_blob:
        base += Decimal(8)
    return Decimal(max(35, min(100, float(base))))


def _score_traction(features: dict[str, Any]) -> Decimal:
    length = features["traction_text_length"]
    return Decimal(max(40, min(95, 35 + (length / 8))))


def _score_social_impact(features: dict[str, Any]) -> Decimal:
    # Stored as 0-10 NLP score and converted to 0-100 scale for weighted engine.
    return Decimal(str(features["social_impact_nlp_10"])) * Decimal(10)


def _score_geography_bonus(features: dict[str, Any]) -> Decimal:
    tier = features["city_tier"]
    if tier == "tier3":
        return Decimal(100)
    if tier == "tier2":
        return Decimal(80)
    return Decimal(40)


def _score_problem_market_fit(features: dict[str, Any], application: Any) -> Decimal:
    problem_len = len((application.problem_statement or "").strip())
    customer_defined = 15 if (application.target_market or "").strip() else 0
    base = min(100, 35 + (problem_len / 5) + customer_defined)
    return Decimal(max(0, base)).quantize(Decimal("0.01"))


def _score_solution_strength(features: dict[str, Any], application: Any) -> Decimal:
    solution_len = len((application.solution_description or "").strip())
    company_len = len((getattr(application, "application_payload", {}) or {}).get("problem_solution", {}).get("company_description", ""))
    base = min(100, 30 + (solution_len / 5) + (company_len / 8))
    return Decimal(max(0, base)).quantize(Decimal("0.01"))


def _score_founder_strength(features: dict[str, Any]) -> Decimal:
    return Decimal(str(features.get("founder_strength_signal", 50))).quantize(Decimal("0.01"))


def _tier_multiplier(features: dict[str, Any]) -> Decimal:
    tier = features.get("city_tier", "tier1")
    if tier == "tier3":
        return Decimal("1.15")
    if tier == "tier2":
        return Decimal("1.10")
    return Decimal("1.05")


def _social_bonus_points(features: dict[str, Any]) -> Decimal:
    social_10 = Decimal(str(features.get("social_impact_nlp_10", 0)))
    return min(Decimal("15"), (social_10 / Decimal("10")) * Decimal("15")).quantize(Decimal("0.01"))


def compute_program_score(features: dict[str, Any], application: Any, program: Any, config: ProgramConfig) -> dict[str, Decimal]:
    # Six required dimensions.
    problem_market_fit = _score_problem_market_fit(features, application)
    solution_strength = _score_solution_strength(features, application)
    founder_strength = _score_founder_strength(features)
    traction = _score_traction(features)
    social_impact = _score_social_impact(features)
    program_fit = (
        (_score_stage_fit(features, program) * Decimal("0.5"))
        + (_score_sector_fit(features, program) * Decimal("0.5"))
    ).quantize(Decimal("0.01"))

    core_weights = settings.CORE_SCORING_WEIGHTS
    weighted_program_score = (
        (problem_market_fit * Decimal(str(core_weights["problem_market_fit"])))
        + (solution_strength * Decimal(str(core_weights["solution_strength"])))
        + (founder_strength * Decimal(str(core_weights["founder_strength"])))
        + (traction * Decimal(str(core_weights["traction"])))
        + (social_impact * Decimal(str(core_weights["social_impact"])))
        + (program_fit * Decimal(str(core_weights["program_fit"])))
    ).quantize(Decimal("0.01"))

    tier_multiplier = _tier_multiplier(features)
    social_bonus = _social_bonus_points(features)
    weighted_program_score = ((weighted_program_score * tier_multiplier) + social_bonus).quantize(Decimal("0.01"))
    geography_bonus = _score_geography_bonus(features)

    return {
        "problem_market_fit": problem_market_fit,
        "solution_strength": solution_strength,
        "founder_strength": founder_strength,
        "traction": traction,
        "social_impact": social_impact,
        "program_fit": program_fit,
        "geography_bonus": geography_bonus,
        "tier_multiplier": tier_multiplier,
        "social_bonus": social_bonus,
        "program_score": weighted_program_score,
    }

