import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Application(Base):
    __tablename__ = "applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    status = Column(String, nullable=False, default="draft")
    # 'draft' | 'submitted' | 'scoring' | 'scored' | 'under_review' | 'shortlisted' | 'offered' | 'rejected'

    # Founder & startup info
    startup_name = Column(String, nullable=False)
    founder_name = Column(String, nullable=False)
    co_founders = Column(JSONB)
    city = Column(String, nullable=False)
    state = Column(String, nullable=False)
    is_tier2_city = Column(Boolean, default=False)
    founding_year = Column(Integer)
    sector = Column(String)
    stage = Column(String) # 'idea' | 'mvp' | 'revenue' | 'growth'
    website_url = Column(String)
    linkedin_url = Column(String)

    # Problem & solution
    problem_statement = Column(Text)
    solution_description = Column(Text)
    target_market = Column(Text)
    traction = Column(Text)
    revenue_model = Column(Text)
    social_impact_score = Column(Integer)
    social_impact_description = Column(Text)

    # Team
    team_size = Column(Integer)
    team_background = Column(Text)
    previous_funding = Column(Text)

    # Files
    pitch_deck_url = Column(String)
    video_pitch_url = Column(String)

    # Program preferences (ordered)
    preference_1 = Column(UUID(as_uuid=True), ForeignKey("programs.id"), nullable=False)
    preference_2 = Column(UUID(as_uuid=True), ForeignKey("programs.id"), nullable=False)
    preference_3 = Column(UUID(as_uuid=True), ForeignKey("programs.id"), nullable=False)

    # Scoring output
    assigned_program_id = Column(UUID(as_uuid=True), ForeignKey("programs.id"))
    scoring_status = Column(String, default="pending")  # 'pending' | 'in_progress' | 'completed' | 'failed'
    application_payload = Column(JSONB)
    derived_fields = Column(JSONB)

    submitted_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    assigned_program = relationship("Program", foreign_keys=[assigned_program_id])
