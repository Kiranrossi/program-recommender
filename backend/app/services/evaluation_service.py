from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.explanation_agent import ExplanationAgent
from app.agents.feature_extraction_agent import FeatureExtractionAgent
from app.agents.matching_agent import MatchingAgent
from app.agents.scoring_agent import ScoringAgent
from app.models.application import Application
from app.models.program import Program
from app.models.score import ApplicationScore
from app.services.program_config_service import ensure_program_configs


async def evaluate_application(db: AsyncSession, application: Application) -> None:
    programs = (await db.execute(select(Program).where(Program.is_active.is_(True)))).scalars().all()
    if not programs:
        application.scoring_status = "failed"
        await db.commit()
        return

    feature_agent = FeatureExtractionAgent()
    scoring_agent = ScoringAgent()
    matching_agent = MatchingAgent()
    explanation_agent = ExplanationAgent()

    config_map = await ensure_program_configs(db, programs)
    features = await feature_agent.run(application)
    scored_candidates: list[dict] = []

    for program in programs:
        config = config_map.get(program.id)
        if not config or not config.is_active:
            # Program is skipped only if config is explicitly inactive.
            continue
        scored = await scoring_agent.run(application, program, config, features)
        scored_candidates.append(scored)

        existing = (
            await db.execute(
                select(ApplicationScore).where(
                    ApplicationScore.application_id == application.id,
                    ApplicationScore.program_id == program.id,
                )
            )
        ).scalar_one_or_none()
        explainability_summary = await explanation_agent.score_explanation(
            program,
            scored["score_parts"],
            scored["preference_rank"],
        )
        payload = {
            "total_score": scored["score_parts"]["program_score"],
            "program_fit_score": scored["score_parts"]["program_fit"],
            "preference_score": scored["preference_score"],
            "final_score": scored["final_score"],
            "score_problem_clarity": scored["score_parts"]["problem_market_fit"],
            "score_solution_viability": scored["score_parts"]["solution_strength"],
            "score_market_potential": scored["score_parts"]["program_fit"],
            "score_team_strength": scored["score_parts"]["founder_strength"],
            "score_traction": scored["score_parts"]["traction"],
            "score_social_impact": scored["score_parts"]["social_impact"],
            "score_tier2_bonus": scored["score_parts"]["social_bonus"],
            "feature_snapshot": features,
            "score_breakdown": {k: str(v) for k, v in scored["score_parts"].items()},
            "ai_reasoning": "Computed by C2R evaluation engine from extracted features.",
            "explainability_summary": explainability_summary,
        }

        if existing:
            for key, value in payload.items():
                setattr(existing, key, value)
        else:
            db.add(
                ApplicationScore(
                    application_id=application.id,
                    program_id=program.id,
                    **payload,
                )
            )

    winner = await matching_agent.run(scored_candidates)
    for rank, row in enumerate(sorted(scored_candidates, key=lambda item: item["final_score"], reverse=True), start=1):
        score_row = (
            await db.execute(
                select(ApplicationScore).where(
                    ApplicationScore.application_id == application.id,
                    ApplicationScore.program_id == row["program_id"],
                )
            )
        ).scalar_one_or_none()
        if score_row:
            score_row.tie_break_rank = rank

    application.assigned_program_id = winner["program_id"]
    application.scoring_status = "completed"
    application.status = "under_review"
    await db.commit()

