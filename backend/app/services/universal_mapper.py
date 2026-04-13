from typing import Any
from uuid import UUID


def map_universal_payload_to_application_fields(payload: Any) -> dict[str, Any]:
    founder = payload.founder
    startup = payload.startup
    problem_solution = payload.problem_solution
    business = payload.business
    traction = payload.traction
    impact = payload.impact
    assets = payload.assets
    team = payload.team
    preferences = payload.preferences

    top_3: list[UUID] = preferences.top_3_programs
    return {
        "startup_name": startup.name,
        "founder_name": founder.name,
        "co_founders": [co.model_dump(mode="json") for co in team.cofounders] if team.cofounders else None,
        "city": founder.current_location,
        "state": founder.permanent_location,
        "founding_year": startup.founding_year,
        "sector": startup.sector,
        "stage": startup.stage,
        "website_url": str(business.website) if business.website else None,
        "linkedin_url": str(founder.linkedin) if founder.linkedin else None,
        "problem_statement": problem_solution.problem_statement,
        "solution_description": problem_solution.solution_description,
        "target_market": problem_solution.target_customer,
        "traction": traction.funding_details,
        "revenue_model": business.market_type,
        "social_impact_score": impact.social_impact_score,
        "social_impact_description": ",".join(impact.sdg_alignment or []),
        "team_size": startup.team_size,
        "team_background": founder.education,
        "previous_funding": traction.funding_status,
        "pitch_deck_url": assets.pitch_deck,
        "video_pitch_url": assets.video_pitch,
        "preference_1": top_3[0],
        "preference_2": top_3[1],
        "preference_3": top_3[2],
    }

