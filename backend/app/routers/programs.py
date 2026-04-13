from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.program import Program
from app.models.program_config import ProgramConfig
from app.utils.serializers import model_to_dict

router = APIRouter(prefix="/programs", tags=["programs"])


@router.get("/options")
async def list_program_options(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Program).where(Program.is_active.is_(True)).order_by(Program.name.asc()))
    items = result.scalars().all()
    config_rows = (await db.execute(select(ProgramConfig))).scalars().all()
    config_map = {row.program_id: row for row in config_rows}
    data = []
    for program in items:
        cfg = config_map.get(program.id)
        cfg_json = cfg.config_json if cfg else {}
        data.append(
            {
                "id": str(program.id),
                "name": program.name,
                "slug": program.slug,
                "required_fields": cfg_json.get("required_fields", []),
                "scoring_weights": {
                    "stage_fit": float(cfg.stage_fit_weight) if cfg else 0.25,
                    "sector_fit": float(cfg.sector_fit_weight) if cfg else 0.20,
                    "traction": float(cfg.traction_weight) if cfg else 0.20,
                    "social_impact": float(cfg.social_impact_weight) if cfg else 0.20,
                    "geography": float(cfg.geography_bonus_weight) if cfg else 0.15,
                },
            }
        )
    return {"success": True, "data": data}


@router.get("")
async def list_programs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Program).where(Program.is_active.is_(True)).order_by(Program.name.asc()))
    items = result.scalars().all()
    return {"success": True, "data": [model_to_dict(program) for program in items]}
