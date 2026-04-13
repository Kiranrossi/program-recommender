from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

import bcrypt
import jwt
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.middleware.auth import LOCAL_ADMIN_ID
from app.models.user import User
from app.schemas.auth import GoogleAuthRequest, LoginRequest, RegisterRequest, TokenResponse, UserPublic


def _jwt_secret() -> str:
    s = (settings.AUTH_JWT_SECRET or "").strip()
    return s or settings.INTERNAL_SECRET


def hash_password(password: str) -> str:
    digest = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    return digest.decode("ascii")


def verify_password(plain: str, hashed: str | None) -> bool:
    if not hashed:
        return False
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("ascii"))
    except ValueError:
        return False


def create_access_token(*, user_id: UUID, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.AUTH_ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": str(user_id), "role": role, "exp": expire}
    return jwt.encode(payload, _jwt_secret(), algorithm="HS256")


def _user_public(u: User) -> UserPublic:
    return UserPublic(
        id=str(u.id),
        email=u.email,
        full_name=u.full_name,
        role=u.role,
        auth_provider=u.auth_provider,
        email_verified=u.email_verified,
    )


def _token_response(u: User) -> TokenResponse:
    return TokenResponse(access_token=create_access_token(user_id=u.id, role=u.role), user=_user_public(u))


async def register_user(db: AsyncSession, body: RegisterRequest) -> TokenResponse:
    email = body.email.lower().strip()
    role = "applicant"
    if body.account_kind == "team":
        code = (settings.ADMIN_INVITE_CODE or "").strip()
        if not code or (body.invite_code or "").strip() != code:
            raise ValueError("Invalid or missing invite code for NSRCEL team signup.")
        role = "admin"

    existing = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if existing:
        raise ValueError("An account with this email already exists.")

    full_name = f"{body.first_name.strip()} {body.last_name.strip()}".strip()
    user = User(
        id=uuid4(),
        clerk_id=None,
        email=email,
        full_name=full_name,
        role=role,
        password_hash=hash_password(body.password),
        auth_provider="password",
        email_verified=False,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return _token_response(user)


async def login_user(db: AsyncSession, body: LoginRequest) -> TokenResponse:
    email = body.email.lower().strip()
    user = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if not user or not verify_password(body.password, user.password_hash):
        raise ValueError("Invalid email or password.")
    return _token_response(user)


async def google_auth(db: AsyncSession, body: GoogleAuthRequest) -> TokenResponse:
    cid = (settings.GOOGLE_CLIENT_ID or "").strip()
    if not cid:
        raise ValueError("Google sign-in is not configured on the server.")

    try:
        idinfo = google_id_token.verify_oauth2_token(body.credential, google_requests.Request(), cid)
    except ValueError as exc:
        raise ValueError("Invalid Google credential.") from exc

    sub = idinfo.get("sub")
    email = (idinfo.get("email") or "").lower().strip()
    if not sub or not email:
        raise ValueError("Google account did not return an email.")

    email_verified = bool(idinfo.get("email_verified"))
    full_name = (idinfo.get("name") or "").strip() or email.split("@")[0]

    user = (await db.execute(select(User).where(User.google_sub == sub))).scalar_one_or_none()
    if user:
        if not user.email_verified and email_verified:
            user.email_verified = True
            await db.commit()
            await db.refresh(user)
        return _token_response(user)

    by_email = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if by_email:
        if by_email.google_sub and by_email.google_sub != sub:
            raise ValueError("This email is linked to a different Google account.")
        by_email.google_sub = sub
        by_email.auth_provider = "google"
        if email_verified:
            by_email.email_verified = True
        await db.commit()
        await db.refresh(by_email)
        return _token_response(by_email)

    user = User(
        id=uuid4(),
        clerk_id=None,
        email=email,
        full_name=full_name,
        role="applicant",
        password_hash=None,
        google_sub=sub,
        auth_provider="google",
        email_verified=email_verified,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return _token_response(user)


async def get_user_by_id(db: AsyncSession, user_id: UUID) -> User | None:
    return (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()


async def legacy_admin_login(db: AsyncSession, username: str, password: str) -> TokenResponse:
    if not settings.ALLOW_LEGACY_ADMIN:
        raise ValueError("Legacy admin login is disabled.")
    if username != settings.LEGACY_ADMIN_USERNAME or password != settings.LEGACY_ADMIN_PASSWORD:
        raise ValueError("Invalid username or password.")
    admin_uuid = UUID(LOCAL_ADMIN_ID)
    user = await get_user_by_id(db, admin_uuid)
    if not user:
        user = User(
            id=admin_uuid,
            clerk_id=None,
            email="legacy-admin@nsrcel.local",
            full_name="Admin (dev)",
            role="admin",
            auth_provider="password",
            password_hash=None,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    elif user.role != "admin":
        user.role = "admin"
        await db.commit()
        await db.refresh(user)
    return _token_response(user)
