"""initial schema

Revision ID: 20260410_0001
Revises:
Create Date: 2026-04-10
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "20260410_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto";')

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("clerk_id", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("full_name", sa.String(), nullable=False),
        sa.Column("role", sa.String(), nullable=False, server_default="applicant"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("clerk_id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_clerk_id", "users", ["clerk_id"], unique=True)
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "programs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("slug", sa.String(), nullable=False),
        sa.Column("description", sa.String(), nullable=True),
        sa.Column("criteria", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("application_deadline", sa.DateTime(timezone=True), nullable=True),
        sa.Column("max_intake", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("slug"),
    )
    op.create_index("ix_programs_slug", "programs", ["slug"], unique=True)

    op.create_table(
        "applications",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default="draft"),
        sa.Column("startup_name", sa.String(), nullable=False),
        sa.Column("founder_name", sa.String(), nullable=False),
        sa.Column("co_founders", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("city", sa.String(), nullable=False),
        sa.Column("state", sa.String(), nullable=False),
        sa.Column("is_tier2_city", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("founding_year", sa.Integer(), nullable=True),
        sa.Column("sector", sa.String(), nullable=True),
        sa.Column("stage", sa.String(), nullable=True),
        sa.Column("website_url", sa.String(), nullable=True),
        sa.Column("linkedin_url", sa.String(), nullable=True),
        sa.Column("problem_statement", sa.Text(), nullable=True),
        sa.Column("solution_description", sa.Text(), nullable=True),
        sa.Column("target_market", sa.Text(), nullable=True),
        sa.Column("traction", sa.Text(), nullable=True),
        sa.Column("revenue_model", sa.Text(), nullable=True),
        sa.Column("social_impact_score", sa.Integer(), nullable=True),
        sa.Column("social_impact_description", sa.Text(), nullable=True),
        sa.Column("team_size", sa.Integer(), nullable=True),
        sa.Column("team_background", sa.Text(), nullable=True),
        sa.Column("previous_funding", sa.Text(), nullable=True),
        sa.Column("pitch_deck_url", sa.String(), nullable=True),
        sa.Column("video_pitch_url", sa.String(), nullable=True),
        sa.Column("preference_1", postgresql.UUID(as_uuid=True), sa.ForeignKey("programs.id"), nullable=False),
        sa.Column("preference_2", postgresql.UUID(as_uuid=True), sa.ForeignKey("programs.id"), nullable=False),
        sa.Column("preference_3", postgresql.UUID(as_uuid=True), sa.ForeignKey("programs.id"), nullable=False),
        sa.Column("assigned_program_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("programs.id"), nullable=True),
        sa.Column("scoring_status", sa.String(), server_default="pending", nullable=False),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    op.create_table(
        "application_scores",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("application_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("applications.id"), nullable=False),
        sa.Column("program_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("programs.id"), nullable=False),
        sa.Column("score_problem_clarity", sa.Numeric(5, 2), nullable=True),
        sa.Column("score_solution_viability", sa.Numeric(5, 2), nullable=True),
        sa.Column("score_market_potential", sa.Numeric(5, 2), nullable=True),
        sa.Column("score_team_strength", sa.Numeric(5, 2), nullable=True),
        sa.Column("score_traction", sa.Numeric(5, 2), nullable=True),
        sa.Column("score_social_impact", sa.Numeric(5, 2), nullable=True),
        sa.Column("score_tier2_bonus", sa.Numeric(5, 2), nullable=True),
        sa.Column("total_score", sa.Numeric(5, 2), nullable=True),
        sa.Column("program_fit_score", sa.Numeric(5, 2), nullable=True),
        sa.Column("ai_reasoning", sa.Text(), nullable=True),
        sa.Column("tie_break_rank", sa.Integer(), nullable=True),
        sa.Column("scored_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("application_id", "program_id", name="uq_application_program_score"),
    )

    op.create_table(
        "hitl_reviews",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("application_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("applications.id"), nullable=False),
        sa.Column("reviewed_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("qualitative_notes", sa.Text(), nullable=True),
        sa.Column("video_assessment", sa.Text(), nullable=True),
        sa.Column("deck_assessment", sa.Text(), nullable=True),
        sa.Column("team_assessment", sa.Text(), nullable=True),
        sa.Column("reviewer_score_override", sa.Numeric(5, 2), nullable=True),
        sa.Column("recommended_program_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("programs.id"), nullable=True),
        sa.Column("verdict", sa.String(), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    op.create_table(
        "decisions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("application_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("applications.id"), nullable=False),
        sa.Column("decided_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("program_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("programs.id"), nullable=True),
        sa.Column("outcome", sa.String(), nullable=False),
        sa.Column("offer_details", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("rejection_reason", sa.Text(), nullable=True),
        sa.Column("notified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("decided_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("decisions")
    op.drop_table("hitl_reviews")
    op.drop_table("application_scores")
    op.drop_table("applications")
    op.drop_index("ix_programs_slug", table_name="programs")
    op.drop_table("programs")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_index("ix_users_clerk_id", table_name="users")
    op.drop_table("users")
