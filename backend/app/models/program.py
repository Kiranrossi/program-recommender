import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from app.database import Base

class Program(Base):
    __tablename__ = "programs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False, index=True)
    description = Column(String)
    criteria = Column(JSONB, nullable=False)  # scoring rubric, weightage config
    is_active = Column(Boolean, default=True)
    application_deadline = Column(DateTime(timezone=True))
    max_intake = Column(Integer)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
