import json
from typing import Any

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "NSRCEL Application Management System"
    ENVIRONMENT: str = "local"

    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/nsrcel_db"
    # If True, use certifi CA bundle for Supabase TLS (fixes some SSL verify failures).
    DATABASE_SSL_USE_CERTIFI: bool = True
    # Dev only: set true if TLS fails with "self-signed certificate in certificate chain" (e.g. corporate proxy). Do not use in production.
    DATABASE_SSL_INSECURE: bool = False
    SQL_ECHO: bool = False

    REDIS_URL: str = "redis://localhost:6379"
    GROQ_API_KEY: str = ""
    INTERNAL_SECRET: str = "secret-for-dev"
    AUTO_SHORTLIST_THRESHOLD: float = 80.0
    DEFAULT_PROGRAM_WEIGHTS: dict[str, float] = {
        "stage_fit_weight": 0.25,
        "sector_fit_weight": 0.20,
        "traction_weight": 0.20,
        "social_impact_weight": 0.20,
        "geography_bonus_weight": 0.15,
        "program_priority": 0.0,
    }
    CORE_SCORING_WEIGHTS: dict[str, float] = {
        "problem_market_fit": 0.25,
        "solution_strength": 0.20,
        "founder_strength": 0.20,
        "traction": 0.15,
        "social_impact": 0.10,
        "program_fit": 0.10,
    }

    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    UPLOAD_DIR: str = "uploads"

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Any) -> list[str]:
        """Render/.env often set this as a JSON string; parse so CORS middleware gets real origins."""
        if v is None:
            return ["http://localhost:3000", "http://127.0.0.1:3000"]
        if isinstance(v, list):
            return [str(x).strip() for x in v if str(x).strip()]
        if isinstance(v, str):
            s = v.strip()
            if not s:
                return ["http://localhost:3000", "http://127.0.0.1:3000"]
            if s.startswith("["):
                try:
                    parsed = json.loads(s)
                    if isinstance(parsed, list):
                        return [str(x).strip() for x in parsed if str(x).strip()]
                except json.JSONDecodeError:
                    pass
            return [s]
        return ["http://localhost:3000", "http://127.0.0.1:3000"]

    # Clerk
    CLERK_SECRET_KEY: str = ""
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: str = ""
    CLERK_JWT_VERIFY: bool = False
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""

    # App JWT (HS256) for email/password and Google sign-in. Falls back to INTERNAL_SECRET if empty.
    AUTH_JWT_SECRET: str = ""
    AUTH_ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days
    # Server-side Google OAuth client ID (Web application) — must match NEXT_PUBLIC_GOOGLE_CLIENT_ID.
    GOOGLE_CLIENT_ID: str = ""
    # Required non-empty string for registering role=admin (NSRCEL team) accounts.
    ADMIN_INVITE_CODE: str = ""

    # Dev-only: /auth/legacy-admin issues a real admin JWT (disable in production).
    ALLOW_LEGACY_ADMIN: bool = True
    LEGACY_ADMIN_USERNAME: str = "karthig"
    LEGACY_ADMIN_PASSWORD: str = "1234"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
