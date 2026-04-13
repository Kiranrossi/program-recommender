"""add universal payload columns

Revision ID: 20260413_0003
Revises: 20260413_0002
Create Date: 2026-04-13
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260413_0003"
down_revision = "20260413_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("applications", sa.Column("application_payload", postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column("applications", sa.Column("derived_fields", postgresql.JSONB(astext_type=sa.Text()), nullable=True))


def downgrade() -> None:
    op.drop_column("applications", "derived_fields")
    op.drop_column("applications", "application_payload")

