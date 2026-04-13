from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.application import Application
from app.models.score import Decision, HitlReview
from app.models.user import User


async def ensure_admin_exists(db: AsyncSession, admin_user: dict) -> UUID:
    admin_uuid = UUID(admin_user["user_id"])
    existing = (await db.execute(select(User).where(User.id == admin_uuid))).scalar_one_or_none()
    if existing:
        return admin_uuid

    db.add(
        User(
            id=admin_uuid,
            clerk_id=None,
            email=f"admin.{str(admin_uuid)[:8]}@local.test",
            full_name="Local Admin",
            role="admin",
            auth_provider="password",
        )
    )
    await db.commit()
    return admin_uuid


async def create_hitl_review(db: AsyncSession, application: Application, admin_uuid: UUID, payload: dict) -> HitlReview:
    review = HitlReview(application_id=application.id, reviewed_by=admin_uuid, **payload)
    if payload.get("recommended_program_id"):
        application.assigned_program_id = payload["recommended_program_id"]
    application.status = "under_review"
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return review


async def create_decision(db: AsyncSession, application: Application, admin_uuid: UUID, payload: dict) -> Decision:
    decision = Decision(
        application_id=application.id,
        decided_by=admin_uuid,
        program_id=payload.get("program_id"),
        outcome=payload["outcome"],
        offer_details=payload.get("offer_details"),
        rejection_reason=payload.get("rejection_reason"),
        decided_at=datetime.now(timezone.utc),
    )
    application.status = payload["outcome"]
    db.add(decision)
    await db.commit()
    await db.refresh(decision)
    return decision

