import logging
import os

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.config import settings
from app.database import AsyncSessionLocal
from app.routers import admin, applications, auth, internal, programs, simulations

logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="Backend API for NSRCEL Application Management System",
    version="1.0.0"
)

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

@app.get("/api/v1/health")
async def health_check():
    """Process is up; `database` reports whether Supabase/Postgres accepts connections (debugging deploys)."""
    db_ok = False
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        logger.exception("Health check: database connection failed")
    return {
        "success": True,
        "data": {
            "status": "ok",
            "database": "up" if db_ok else "down",
            "message": "NSRCEL API Backend is up.",
        },
    }


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"success": False, "error": str(exc), "data": None},
    )


app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(applications.router, prefix=settings.API_V1_STR)
app.include_router(programs.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)
app.include_router(simulations.router, prefix=settings.API_V1_STR)
app.include_router(internal.router, prefix=settings.API_V1_STR)
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
