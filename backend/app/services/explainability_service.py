from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.explanation_agent import ExplanationAgent
from app.models.program import Program
from app.models.score import ApplicationScore


def _to_decimal(value, default: str = "0") -> Decimal:
    if value is None:
        return Decimal(default)
    return Decimal(str(value))


async def build_application_explainability(db: AsyncSession, application_id: UUID) -> dict:
    explanation_agent = ExplanationAgent()
    scores = (
        await db.execute(
            select(ApplicationScore).where(ApplicationScore.application_id == application_id)
        )
    ).scalars().all()
    if not scores:
        return {
            "top_program_selected": None,
            "top_3_scores": [],
            "reason": [],
        }

    program_ids = [score.program_id for score in scores]
    programs = (
        await db.execute(select(Program).where(Program.id.in_(program_ids)))
    ).scalars().all()
    program_name_map = {program.id: program.name for program in programs}

    ranked = sorted(
        scores,
        key=lambda row: _to_decimal(row.final_score),
        reverse=True,
    )
    top = ranked[0]
    top_3 = ranked[:3]

    reasons = await explanation_agent.selection_reasons(top)

    return {
        "top_program_selected": {
            "program_id": str(top.program_id),
            "program_name": program_name_map.get(top.program_id, "Unknown Program"),
            "final_score": str(top.final_score) if top.final_score is not None else None,
        },
        "top_3_scores": [
            {
                "program_id": str(score.program_id),
                "program_name": program_name_map.get(score.program_id, "Unknown Program"),
                "program_score": str(score.total_score) if score.total_score is not None else None,
                "preference_score": str(score.preference_score) if score.preference_score is not None else None,
                "final_score": str(score.final_score) if score.final_score is not None else None,
            }
            for score in top_3
        ],
        "reason": reasons,
    }


async def build_evaluation_result_json(db: AsyncSession, application_id: UUID) -> dict:
    scores = (await db.execute(select(ApplicationScore).where(ApplicationScore.application_id == application_id))).scalars().all()
    if not scores:
        return {
            "applicant_id": str(application_id),
            "program_scores": {},
            "top_3_programs": [],
            "final_program": "",
            "confidence": 0.0,
            "reasoning": "No scoring rows available.",
        }
    program_ids = [score.program_id for score in scores]
    programs = (await db.execute(select(Program).where(Program.id.in_(program_ids)))).scalars().all()
    program_name_map = {program.id: program.name for program in programs}
    ranked = sorted(scores, key=lambda row: _to_decimal(row.final_score), reverse=True)
    top = ranked[0]
    second = ranked[1] if len(ranked) > 1 else None
    confidence = float(max(0, min(1, (_to_decimal(top.final_score) - _to_decimal(second.final_score if second else 0)) / Decimal("100"))))
    reasoning = top.explainability_summary or "Chosen by highest deterministic score after preference-aware tie-break."

    return {
        "applicant_id": str(application_id),
        "program_scores": {
            program_name_map.get(score.program_id, str(score.program_id)): float(_to_decimal(score.final_score))
            for score in ranked
        },
        "top_3_programs": [program_name_map.get(score.program_id, str(score.program_id)) for score in ranked[:3]],
        "final_program": program_name_map.get(top.program_id, str(top.program_id)),
        "confidence": round(confidence, 4),
        "reasoning": reasoning,
    }

