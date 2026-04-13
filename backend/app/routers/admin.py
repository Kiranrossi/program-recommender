from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.database import get_db
from app.middleware.auth import get_admin_user
from app.models.application import Application
from app.models.score import ApplicationScore, Decision, HitlReview
from app.services.explainability_service import build_application_explainability
from app.services.review_service import create_decision, create_hitl_review, ensure_admin_exists
from app.utils.serializers import model_to_dict

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(get_admin_user)])

TERMINAL_STATUSES = {"offered", "rejected"}


class HitlReviewPayload(BaseModel):
    qualitative_notes: str | None = None
    video_assessment: str | None = None
    deck_assessment: str | None = None
    team_assessment: str | None = None
    reviewer_score_override: float | None = None
    recommended_program_id: UUID | None = None
    verdict: str


class DecisionPayload(BaseModel):
    outcome: str
    program_id: UUID | None = None
    offer_details: dict | None = None
    rejection_reason: str | None = None


@router.get("/applications")
async def list_applications(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    status_filter: str | None = Query(default=None, alias="status"),
    stage: str | None = Query(default=None),
    sector: str | None = Query(default=None),
    min_score: float | None = Query(default=None, ge=0, le=100),
    program_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
):
    conditions = []
    if status_filter:
        conditions.append(Application.status == status_filter)
    if program_id:
        conditions.append(Application.assigned_program_id == program_id)
    if stage:
        conditions.append(Application.stage == stage)
    if sector:
        conditions.append(Application.sector == sector)

    where_clause = and_(*conditions) if conditions else True
    if min_score is None:
        count_stmt = select(func.count(Application.id)).where(where_clause)
    else:
        score_subquery = (
            select(
                ApplicationScore.application_id.label("application_id"),
                func.max(ApplicationScore.final_score).label("max_final_score"),
            )
            .group_by(ApplicationScore.application_id)
            .subquery()
        )
        count_stmt = (
            select(func.count(Application.id))
            .select_from(Application)
            .join(score_subquery, score_subquery.c.application_id == Application.id, isouter=True)
            .where(where_clause, score_subquery.c.max_final_score >= min_score)
        )
    total = (await db.execute(count_stmt)).scalar_one()

    score_subquery = (
        select(
            ApplicationScore.application_id.label("application_id"),
            func.max(ApplicationScore.final_score).label("max_final_score"),
        )
        .group_by(ApplicationScore.application_id)
        .subquery()
    )
    stmt = select(Application, score_subquery.c.max_final_score).join(
        score_subquery, score_subquery.c.application_id == Application.id, isouter=True
    ).where(where_clause)
    if min_score is not None:
        stmt = stmt.where(score_subquery.c.max_final_score >= min_score)
    stmt = stmt.order_by(Application.created_at.desc()).offset((page - 1) * limit).limit(limit)
    rows = (await db.execute(stmt)).all()
    items = []
    for app, max_final_score in rows:
        payload = model_to_dict(app)
        payload["max_final_score"] = float(max_final_score) if max_final_score is not None else None
        items.append(payload)

    return {
        "success": True,
        "data": {"items": items, "total": total, "page": page, "limit": limit},
    }


@router.get("/applications/{application_id}")
async def get_application_detail(application_id: UUID, db: AsyncSession = Depends(get_db)):
    app = (await db.execute(select(Application).where(Application.id == application_id))).scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    scores = (
        await db.execute(select(ApplicationScore).where(ApplicationScore.application_id == application_id))
    ).scalars().all()
    reviews = (await db.execute(select(HitlReview).where(HitlReview.application_id == application_id))).scalars().all()
    decision = (await db.execute(select(Decision).where(Decision.application_id == application_id))).scalar_one_or_none()
    explainability = await build_application_explainability(db, application_id)

    return {
        "success": True,
        "data": {
            "application": model_to_dict(app),
            "scores": [model_to_dict(score) for score in scores],
            "hitl_reviews": [model_to_dict(review) for review in reviews],
            "decision": model_to_dict(decision) if decision else None,
            "explainability": explainability,
        },
    }


@router.patch("/applications/{application_id}/review")
async def submit_review(
    application_id: UUID,
    payload: HitlReviewPayload,
    admin_user: dict = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    admin_uuid = await ensure_admin_exists(db, admin_user)
    app = (await db.execute(select(Application).where(Application.id == application_id))).scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    if app.status in TERMINAL_STATUSES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Application is in terminal status")

    review = await create_hitl_review(db, app, admin_uuid, payload.model_dump())
    return {"success": True, "data": model_to_dict(review)}


@router.post("/applications/{application_id}/shortlist")
async def shortlist_application(application_id: UUID, db: AsyncSession = Depends(get_db)):
    app = (await db.execute(select(Application).where(Application.id == application_id))).scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    if app.status in TERMINAL_STATUSES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Application is in terminal status")
    app.status = "shortlisted"
    await db.commit()
    return {"success": True, "data": {"application_id": app.id, "status": app.status}}


@router.post("/applications/{application_id}/decision")
async def record_decision(
    application_id: UUID,
    payload: DecisionPayload,
    admin_user: dict = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    admin_uuid = await ensure_admin_exists(db, admin_user)
    app = (await db.execute(select(Application).where(Application.id == application_id))).scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    if app.status in TERMINAL_STATUSES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Decision already recorded")
    if payload.outcome not in TERMINAL_STATUSES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Outcome must be offered or rejected")

    decision = await create_decision(db, app, admin_uuid, payload.model_dump())
    return {"success": True, "data": model_to_dict(decision)}


@router.get("/reports")
async def admin_reports(db: AsyncSession = Depends(get_db)):
    total_applications = (await db.execute(select(func.count(Application.id)))).scalar_one()
    tier2_count = (await db.execute(select(func.count(Application.id)).where(Application.is_tier2_city.is_(True)))).scalar_one()
    by_status_rows = (await db.execute(select(Application.status, func.count()).group_by(Application.status))).all()
    by_status = {row[0]: row[1] for row in by_status_rows}
    tier2_percent = (tier2_count / total_applications * 100) if total_applications else 0
    return {
        "success": True,
        "data": {
            "total_applications": total_applications,
            "by_status": by_status,
            "tier2_count": tier2_count,
            "tier2_percent": round(tier2_percent, 2),
        },
    }
