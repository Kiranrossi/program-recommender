from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_internal_system
from app.models.application import Application

router = APIRouter(prefix="/internal", tags=["internal"], dependencies=[Depends(get_internal_system)])


class TriggerScoreRequest(BaseModel):
    application_id: UUID


class ScoreResultRequest(BaseModel):
    assigned_program_id: UUID | None = None
    scoring_status: str
    status: str = "scored"


@router.post("/score")
async def trigger_scoring(payload: TriggerScoreRequest, db: AsyncSession = Depends(get_db)):
    app = (await db.execute(select(Application).where(Application.id == payload.application_id))).scalar_one_or_none()
    if not app:
        return {"success": False, "error": "Application not found"}

    app.scoring_status = "in_progress"
    app.status = "scoring"
    await db.commit()
    return {"success": True, "data": {"application_id": app.id, "scoring_status": app.scoring_status}}


@router.patch("/score/{application_id}/result")
async def update_scoring_result(application_id: UUID, payload: ScoreResultRequest, db: AsyncSession = Depends(get_db)):
    app = (await db.execute(select(Application).where(Application.id == application_id))).scalar_one_or_none()
    if not app:
        return {"success": False, "error": "Application not found"}

    app.assigned_program_id = payload.assigned_program_id
    app.scoring_status = payload.scoring_status
    app.status = payload.status
    await db.commit()
    return {"success": True, "data": {"application_id": app.id, "status": app.status}}
