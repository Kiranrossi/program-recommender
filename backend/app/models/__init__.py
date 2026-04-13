from app.database import Base
from app.models.user import User
from app.models.program import Program
from app.models.program_config import ProgramConfig
from app.models.application import Application
from app.models.score import ApplicationScore, HitlReview, Decision

# This allows alembic to find all models by just importing Base from here
__all__ = [
    "Base",
    "User",
    "Program",
    "ProgramConfig",
    "Application",
    "ApplicationScore",
    "HitlReview",
    "Decision"
]
