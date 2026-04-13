import uuid

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.sql import func

from app.database import Base


class ProgramConfig(Base):
    __tablename__ = "program_configs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    program_id = Column(UUID(as_uuid=True), ForeignKey("programs.id"), nullable=False, unique=True)
    is_active = Column(Boolean, nullable=False, default=True)

    # Configurable weights for intelligent matching.
    stage_fit_weight = Column(Numeric(5, 2), nullable=False, default=0.25)
    sector_fit_weight = Column(Numeric(5, 2), nullable=False, default=0.20)
    traction_weight = Column(Numeric(5, 2), nullable=False, default=0.20)
    social_impact_weight = Column(Numeric(5, 2), nullable=False, default=0.20)
    geography_bonus_weight = Column(Numeric(5, 2), nullable=False, default=0.15)
    program_priority = Column(Numeric(5, 2), nullable=False, default=0)

    # Optional JSON rules for future extensibility.
    config_json = Column(JSONB, nullable=False, default=dict)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
