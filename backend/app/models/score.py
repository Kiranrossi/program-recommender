import uuid
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Numeric, UniqueConstraint, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class ApplicationScore(Base):
    __tablename__ = "application_scores"
    __table_args__ = (UniqueConstraint("application_id", "program_id", name="uq_application_program_score"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id"), nullable=False)
    program_id = Column(UUID(as_uuid=True), ForeignKey("programs.id"), nullable=False)

    score_problem_clarity = Column(Numeric(5,2))
    score_solution_viability = Column(Numeric(5,2))
    score_market_potential = Column(Numeric(5,2))
    score_team_strength = Column(Numeric(5,2))
    score_traction = Column(Numeric(5,2))
    score_social_impact = Column(Numeric(5,2))
    score_tier2_bonus = Column(Numeric(5,2))

    total_score = Column(Numeric(5,2))
    program_fit_score = Column(Numeric(5,2))
    preference_score = Column(Numeric(5,2))
    final_score = Column(Numeric(7,2))
    ai_reasoning = Column(Text)
    explainability_summary = Column(Text)
    feature_snapshot = Column(JSONB)
    score_breakdown = Column(JSONB)
    tie_break_rank = Column(Integer)

    scored_at = Column(DateTime(timezone=True), server_default=func.now())
    
    application = relationship("Application")
    program = relationship("Program")

class HitlReview(Base):
    __tablename__ = "hitl_reviews"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id"), nullable=False)
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    qualitative_notes = Column(Text)
    video_assessment = Column(Text)
    deck_assessment = Column(Text)
    team_assessment = Column(Text)
    reviewer_score_override = Column(Numeric(5,2))
    recommended_program_id = Column(UUID(as_uuid=True), ForeignKey("programs.id"))
    verdict = Column(String) # 'shortlist' | 'reject' | 'offer' | 'hold'

    reviewed_at = Column(DateTime(timezone=True), server_default=func.now())

class Decision(Base):
    __tablename__ = "decisions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id"), nullable=False)
    decided_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    program_id = Column(UUID(as_uuid=True), ForeignKey("programs.id"))
    outcome = Column(String, nullable=False) # 'offered' | 'rejected'
    offer_details = Column(JSONB)
    rejection_reason = Column(Text)
    notified_at = Column(DateTime(timezone=True))
    decided_at = Column(DateTime(timezone=True), server_default=func.now())
