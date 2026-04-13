from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_admin_user
from app.services.simulation_service import run_matching_simulation

router = APIRouter(prefix="/simulations", tags=["simulations"], dependencies=[Depends(get_admin_user)])


@router.post("/run")
async def run_simulation(
    application_count: int = Query(default=10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    result = await run_matching_simulation(db, application_count=application_count)
    return {"success": True, "data": result}

