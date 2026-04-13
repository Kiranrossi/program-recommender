from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.program import Program
from app.models.program_config import ProgramConfig


def _criteria_weight(criteria: dict, key: str, fallback_key: str, default_value: float) -> Decimal:
    value = criteria.get(key, criteria.get(fallback_key, default_value))
    return Decimal(str(value))


async def ensure_program_configs(db: AsyncSession, programs: list[Program]) -> dict:
    existing_rows = (await db.execute(select(ProgramConfig))).scalars().all()
    config_map = {row.program_id: row for row in existing_rows}
    changed = False

    for program in programs:
        if program.id in config_map:
            continue
        criteria = program.criteria or {}
        defaults = settings.DEFAULT_PROGRAM_WEIGHTS
        config = ProgramConfig(
            program_id=program.id,
            stage_fit_weight=_criteria_weight(criteria, "stage_fit_weight", "stage_fit", defaults["stage_fit_weight"]),
            sector_fit_weight=_criteria_weight(criteria, "sector_fit_weight", "sector_fit", defaults["sector_fit_weight"]),
            traction_weight=_criteria_weight(criteria, "traction_weight", "traction", defaults["traction_weight"]),
            social_impact_weight=_criteria_weight(criteria, "social_impact_weight", "social_impact", defaults["social_impact_weight"]),
            geography_bonus_weight=_criteria_weight(criteria, "geography_bonus_weight", "geography_bonus", defaults["geography_bonus_weight"]),
            program_priority=_criteria_weight(criteria, "program_priority", "program_priority", defaults["program_priority"]),
            config_json={"auto_generated": True},
        )
        db.add(config)
        config_map[program.id] = config
        changed = True

    if changed:
        await db.commit()
        existing_rows = (await db.execute(select(ProgramConfig))).scalars().all()
        config_map = {row.program_id: row for row in existing_rows}
    return config_map

