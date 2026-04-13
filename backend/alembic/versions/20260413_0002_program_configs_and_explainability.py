"""program configs and explainability columns

Revision ID: 20260413_0002
Revises: 20260410_0001
Create Date: 2026-04-13
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260413_0002"
down_revision = "20260410_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "program_configs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("program_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("programs.id"), nullable=False, unique=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("stage_fit_weight", sa.Numeric(5, 2), nullable=False, server_default="0.25"),
        sa.Column("sector_fit_weight", sa.Numeric(5, 2), nullable=False, server_default="0.20"),
        sa.Column("traction_weight", sa.Numeric(5, 2), nullable=False, server_default="0.20"),
        sa.Column("social_impact_weight", sa.Numeric(5, 2), nullable=False, server_default="0.20"),
        sa.Column("geography_bonus_weight", sa.Numeric(5, 2), nullable=False, server_default="0.15"),
        sa.Column("program_priority", sa.Numeric(5, 2), nullable=False, server_default="0"),
        sa.Column("config_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    op.add_column("application_scores", sa.Column("preference_score", sa.Numeric(5, 2), nullable=True))
    op.add_column("application_scores", sa.Column("final_score", sa.Numeric(7, 2), nullable=True))
    op.add_column("application_scores", sa.Column("explainability_summary", sa.Text(), nullable=True))
    op.add_column("application_scores", sa.Column("feature_snapshot", postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column("application_scores", sa.Column("score_breakdown", postgresql.JSONB(astext_type=sa.Text()), nullable=True))

    op.execute(
        """
        INSERT INTO program_configs (
            id, program_id, is_active,
            stage_fit_weight, sector_fit_weight, traction_weight, social_impact_weight, geography_bonus_weight,
            program_priority, config_json
        )
        SELECT
            gen_random_uuid(),
            p.id,
            true,
            COALESCE((p.criteria->>'stage_fit')::numeric, 0.25),
            COALESCE((p.criteria->>'sector_fit')::numeric, 0.20),
            COALESCE((p.criteria->>'traction')::numeric, 0.20),
            COALESCE((p.criteria->>'social_impact')::numeric, 0.20),
            COALESCE((p.criteria->>'geography_bonus')::numeric, 0.15),
            COALESCE((p.criteria->>'program_priority')::numeric, 0),
            jsonb_build_object('source', 'migration_default')
        FROM programs p
        ON CONFLICT (program_id) DO NOTHING;
        """
    )


def downgrade() -> None:
    op.drop_column("application_scores", "score_breakdown")
    op.drop_column("application_scores", "feature_snapshot")
    op.drop_column("application_scores", "explainability_summary")
    op.drop_column("application_scores", "final_score")
    op.drop_column("application_scores", "preference_score")
    op.drop_table("program_configs")

