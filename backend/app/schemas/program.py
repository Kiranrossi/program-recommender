from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ProgramOut(BaseModel):
    id: UUID
    name: str
    slug: str
    description: str | None
    criteria: dict
    is_active: bool
    application_deadline: datetime | None
    max_intake: int | None

    model_config = {"from_attributes": True}
