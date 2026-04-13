from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.application import Application
from app.models.user import User
from app.schemas.application import ApplicationCreate
from app.services.city_tier import classify_city_tier
from app.services.feature_extraction import extract_features
from app.services.universal_mapper import map_universal_payload_to_application_fields


async def ensure_user_exists(db: AsyncSession, current_user: dict) -> UUID:
    user_uuid = UUID(current_user["user_id"])
    existing = (await db.execute(select(User).where(User.id == user_uuid))).scalar_one_or_none()
    if existing:
        return user_uuid

    role = current_user.get("role", "applicant")
    db.add(
        User(
            id=user_uuid,
            clerk_id=None,
            email=f"{role}.{str(user_uuid)[:8]}@local.test",
            full_name=f"Local {role.title()}",
            role=role,
            auth_provider="password",
        )
    )
    await db.commit()
    return user_uuid


async def submit_application(db: AsyncSession, payload: ApplicationCreate, current_user: dict) -> Application:
    user_uuid = await ensure_user_exists(db, current_user)
    flat_fields = map_universal_payload_to_application_fields(payload)
    city_tier = classify_city_tier(flat_fields["city"])
    temp_obj = type("PayloadObj", (), flat_fields)()
    derived_fields = extract_features(temp_obj)
    app = Application(
        user_id=user_uuid,
        status="submitted",
        submitted_at=datetime.now(timezone.utc),
        scoring_status="pending",
        is_tier2_city=city_tier in {"tier2", "tier3"},
        application_payload=payload.model_dump(mode="json"),
        derived_fields=derived_fields,
        **flat_fields,
    )
    db.add(app)
    await db.commit()
    await db.refresh(app)
    return app

