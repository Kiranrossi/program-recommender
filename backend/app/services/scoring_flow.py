from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.application import Application
from app.models.program import Program
from app.models.score import ApplicationScore
from app.services.scoring_agent import GroqScoringAgent


def _weighted_total(raw: dict, weights: dict, is_tier2: bool) -> Decimal:
    problem = Decimal(raw["score_problem_clarity"]) * Decimal(str(weights.get("problem_clarity", 0.15)))
    solution = Decimal(raw["score_solution_viability"]) * Decimal(str(weights.get("solution_viability", 0.20)))
    market = Decimal(raw["score_market_potential"]) * Decimal(str(weights.get("market_potential", 0.15)))
    team = Decimal(raw["score_team_strength"]) * Decimal(str(weights.get("team_strength", 0.20)))
    traction = Decimal(raw["score_traction"]) * Decimal(str(weights.get("traction", 0.15)))
    social = Decimal(raw["score_social_impact"]) * Decimal(str(weights.get("social_impact", 0.10)))
    tier2_bonus_weight = Decimal(str(weights.get("tier2_bonus", 0.05)))
    tier2_bonus = Decimal(100) * tier2_bonus_weight if is_tier2 else Decimal(0)
    total = problem + solution + market + team + traction + social + tier2_bonus
    return total.quantize(Decimal("0.01"))


async def score_application(db: AsyncSession, application: Application) -> None:
    programs = (await db.execute(select(Program).where(Program.is_active.is_(True)))).scalars().all()
    if not programs:
        application.scoring_status = "failed"
        return

    application.status = "scoring"
    application.scoring_status = "in_progress"
    await db.commit()

    agent = GroqScoringAgent(settings.GROQ_API_KEY)
    preference_rank_map = {
        application.preference_1: 3,
        application.preference_2: 2,
        application.preference_3: 1,
    }
    scored_rows: list[dict] = []

    for program in programs:
        raw = await agent.score_application_for_program(
            application_data={
                "startup_name": application.startup_name,
                "problem_statement": application.problem_statement or "",
                "solution_description": application.solution_description or "",
                "traction": application.traction or "",
                "social_impact_score": application.social_impact_score or 0,
                "team_background": application.team_background or "",
            },
            program_data={"name": program.name, "description": program.description, "criteria": program.criteria},
        )
        weights = program.criteria or {}
        total_score = _weighted_total(raw, weights, application.is_tier2_city)
        fit = Decimal(raw["program_fit_score"])
        preference_points = Decimal(preference_rank_map.get(program.id, 0))
        match_score = (total_score * fit) + (preference_points * Decimal(10))

        existing = (
            await db.execute(
                select(ApplicationScore).where(
                    ApplicationScore.application_id == application.id,
                    ApplicationScore.program_id == program.id,
                )
            )
        ).scalar_one_or_none()

        score_payload = {
            "score_problem_clarity": raw["score_problem_clarity"],
            "score_solution_viability": raw["score_solution_viability"],
            "score_market_potential": raw["score_market_potential"],
            "score_team_strength": raw["score_team_strength"],
            "score_traction": raw["score_traction"],
            "score_social_impact": raw["score_social_impact"],
            "score_tier2_bonus": Decimal(5 if application.is_tier2_city else 0),
            "total_score": total_score,
            "program_fit_score": fit,
            "ai_reasoning": raw["reasoning"],
        }
        if existing:
            for key, value in score_payload.items():
                setattr(existing, key, value)
        else:
            db.add(
                ApplicationScore(
                    application_id=application.id,
                    program_id=program.id,
                    **score_payload,
                )
            )

        scored_rows.append(
            {
                "program_id": program.id,
                "match_score": match_score,
                "total_score": total_score,
                "program_fit_score": fit,
                "preference_rank": preference_rank_map.get(program.id, 0),
                "program_priority": Decimal(str((program.criteria or {}).get("program_priority", 0))),
                "social_impact": Decimal(raw["score_social_impact"]),
                "team_strength": Decimal(raw["score_team_strength"]),
            }
        )

    preferred_candidates = [row for row in scored_rows if row["preference_rank"] > 0]
    if preferred_candidates:
        preferred_candidates.sort(
            key=lambda row: (
                row["match_score"],          # primary score
                row["preference_rank"],      # tie-break 1: user preference order
                row["program_priority"],     # tie-break 2: program priority
                row["social_impact"],        # tie-break 3: social impact
                row["team_strength"],        # tie-break 4: team strength
            ),
            reverse=True,
        )
        winner = preferred_candidates[0]
    else:
        # Fallback if preferences are malformed/unavailable.
        scored_rows.sort(key=lambda row: row["match_score"], reverse=True)
        winner = scored_rows[0]

    application.assigned_program_id = winner["program_id"]
    application.scoring_status = "completed"
    application.status = (
        "shortlisted"
        if winner["total_score"] >= Decimal(str(settings.AUTO_SHORTLIST_THRESHOLD))
        else "under_review"
    )
    await db.commit()
