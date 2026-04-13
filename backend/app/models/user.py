import uuid

from sqlalchemy import Boolean, Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    clerk_id = Column(String, unique=True, nullable=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    full_name = Column(String, nullable=False)
    role = Column(String, nullable=False, default="applicant")  # 'applicant' | 'admin'

    password_hash = Column(String, nullable=True)
    google_sub = Column(String, unique=True, nullable=True, index=True)
    auth_provider = Column(String, nullable=False, default="password")  # password | google | clerk
    email_verified = Column(Boolean, nullable=False, default=False)
    profile_data = Column(JSONB, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
