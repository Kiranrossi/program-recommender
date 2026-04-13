"""user auth: password hash, google, profile

Revision ID: 20260414_0004
Revises: 20260413_0003
Create Date: 2026-04-14
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20260414_0004"
down_revision = "20260413_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("users", "clerk_id", existing_type=sa.String(), nullable=True)
    op.add_column("users", sa.Column("password_hash", sa.String(), nullable=True))
    op.add_column("users", sa.Column("google_sub", sa.String(), nullable=True))
    op.add_column(
        "users",
        sa.Column("auth_provider", sa.String(), nullable=False, server_default="password"),
    )
    op.add_column("users", sa.Column("email_verified", sa.Boolean(), nullable=False, server_default=sa.text("false")))
    op.add_column("users", sa.Column("profile_data", postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.create_index("ix_users_google_sub", "users", ["google_sub"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_users_google_sub", table_name="users")
    op.drop_column("users", "profile_data")
    op.drop_column("users", "email_verified")
    op.drop_column("users", "auth_provider")
    op.drop_column("users", "google_sub")
    op.drop_column("users", "password_hash")
    op.alter_column("users", "clerk_id", existing_type=sa.String(), nullable=False)
