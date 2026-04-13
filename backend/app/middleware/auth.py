from fastapi import Request, HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import uuid
from app.config import settings

security = HTTPBearer(auto_error=False)
LOCAL_APPLICANT_ID = str(uuid.uuid5(uuid.NAMESPACE_DNS, "local-applicant"))
LOCAL_ADMIN_ID = str(uuid.uuid5(uuid.NAMESPACE_DNS, "local-admin"))


def _app_jwt_secret() -> str:
    return (settings.AUTH_JWT_SECRET or "").strip() or settings.INTERNAL_SECRET


def _decode_bearer_token(token: str) -> dict:
    decoded = None
    try:
        decoded = jwt.decode(token, _app_jwt_secret(), algorithms=["HS256"])
    except jwt.PyJWTError:
        pass

    if decoded is None and settings.CLERK_JWT_VERIFY and (settings.CLERK_SECRET_KEY or "").strip():
        try:
            decoded = jwt.decode(token, settings.CLERK_SECRET_KEY, algorithms=["HS256"])
        except jwt.PyJWTError:
            pass

    if decoded is None and settings.ENVIRONMENT == "local" and not settings.CLERK_JWT_VERIFY:
        try:
            decoded = jwt.decode(token, options={"verify_signature": False})
        except jwt.PyJWTError as exc:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

    if decoded is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    user_id = decoded.get("sub")
    role = decoded.get("role", "applicant")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    try:
        uuid.UUID(user_id)
    except ValueError:
        user_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, user_id))
    return {"user_id": user_id, "role": role}


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Security(security),
):
    if settings.ENVIRONMENT == "local" and not settings.CLERK_JWT_VERIFY and not credentials:
        role = request.headers.get("x-dev-role", "applicant").lower()
        if role not in {"applicant", "admin"}:
            role = "applicant"
        return {"user_id": LOCAL_ADMIN_ID if role == "admin" else LOCAL_APPLICANT_ID, "role": role}

    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    try:
        return _decode_bearer_token(credentials.credentials)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc


async def get_admin_user(user: dict = Security(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin permissions required")
    return user

async def get_internal_system(request: Request):
    """ Used to verify internal webhook or background task calls. """
    secret = request.headers.get("X-Internal-Secret")
    if not secret or secret != settings.INTERNAL_SECRET:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid internal secret")
    return True
