from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.application import Application
from app.services.evaluation_service import evaluate_application


async def run_application_pipeline(application_id) -> None:
    async with AsyncSessionLocal() as db:
        application = (await db.execute(select(Application).where(Application.id == application_id))).scalar_one_or_none()
        if not application:
            return
        application.status = "scoring"
        application.scoring_status = "in_progress"
        await db.commit()
        await evaluate_application(db, application)

