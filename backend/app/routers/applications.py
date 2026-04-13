from datetime import datetime, timezone
import os
import uuid
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.application import Application
from app.models.score import Decision
from app.schemas.application import ApplicationCreate, ApplicationUpdate
from app.services.application_service import submit_application
from app.services.explainability_service import build_application_explainability, build_evaluation_result_json
from app.services.pipeline import run_application_pipeline
from app.utils.serializers import model_to_dict

router = APIRouter(prefix="/applications", tags=["applications"])

TERMINAL_STATUSES = {"offered", "rejected"}


@router.post("")
async def create_application(
    payload: ApplicationCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    app = await submit_application(db, payload, current_user)
    # Event-driven trigger: processing runs outside request-response cycle.
    background_tasks.add_task(run_application_pipeline, app.id)
    return {
        "success": True,
        "data": {"id": app.id, "status": app.status, "submitted_at": app.submitted_at},
    }


@router.get("/{application_id}")
async def get_application(
    application_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    stmt = select(Application).where(
        Application.id == application_id, Application.user_id == UUID(current_user["user_id"])
    )
    result = await db.execute(stmt)
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    return {"success": True, "data": model_to_dict(app)}


@router.patch("/{application_id}")
async def update_application(
    application_id: UUID,
    payload: ApplicationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    stmt = select(Application).where(
        Application.id == application_id, Application.user_id == UUID(current_user["user_id"])
    )
    result = await db.execute(stmt)
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    if app.status != "draft":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only draft applications can be edited")

    if app.status in TERMINAL_STATUSES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Application is in terminal status")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(app, field, value)
    await db.commit()
    await db.refresh(app)
    return {"success": True, "data": model_to_dict(app)}


@router.get("/{application_id}/status")
async def get_application_status(
    application_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    stmt = select(Application).where(
        Application.id == application_id, Application.user_id == UUID(current_user["user_id"])
    )
    result = await db.execute(stmt)
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    decision_result = await db.execute(select(Decision).where(Decision.application_id == app.id))
    decision = decision_result.scalar_one_or_none()
    explainability = await build_application_explainability(db, app.id)
    return {
        "success": True,
        "data": {
            "status": app.status,
            "scoring_status": app.scoring_status,
            "assigned_program": app.assigned_program_id,
            "decision": decision.outcome if decision else None,
            "explainability": explainability,
        },
    }


@router.post("/{application_id}/files")
async def upload_application_files(
    application_id: UUID,
    file: UploadFile | None = File(default=None),
    video_url: str | None = Form(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    stmt = select(Application).where(
        Application.id == application_id, Application.user_id == UUID(current_user["user_id"])
    )
    app = (await db.execute(stmt)).scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    if not file and not video_url:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Provide either file or video_url")

    if video_url:
        app.video_pitch_url = video_url
        await db.commit()
        return {"success": True, "data": {"file_url": video_url}}

    assert file is not None
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename or "")[1].lower() or ".bin"
    filename = f"{application_id}_{uuid.uuid4().hex}{ext}"
    path = os.path.join(settings.UPLOAD_DIR, filename)
    content = await file.read()
    with open(path, "wb") as out:
        out.write(content)

    public_url = f"/uploads/{filename}"
    if ext == ".pdf":
        app.pitch_deck_url = public_url
    else:
        app.video_pitch_url = public_url
    await db.commit()
    return {"success": True, "data": {"file_url": public_url}}


@router.get("/{application_id}/evaluation-result")
async def get_evaluation_result(
    application_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    stmt = select(Application).where(
        Application.id == application_id, Application.user_id == UUID(current_user["user_id"])
    )
    app = (await db.execute(stmt)).scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    result = await build_evaluation_result_json(db, application_id)
    return {"success": True, "data": result}

