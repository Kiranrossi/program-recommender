from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.schemas.auth import (
    GoogleAuthRequest,
    LegacyAdminLoginRequest,
    LoginRequest,
    ProfilePatchRequest,
    RegisterRequest,
    UserPublic,
)
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register")
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    try:
        data = await auth_service.register_user(db, body)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return {"success": True, "data": data.model_dump(mode="json"), "error": None}


@router.post("/login")
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    try:
        data = await auth_service.login_user(db, body)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
    return {"success": True, "data": data.model_dump(mode="json"), "error": None}


@router.post("/google")
async def google(body: GoogleAuthRequest, db: AsyncSession = Depends(get_db)):
    try:
        data = await auth_service.google_auth(db, body)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return {"success": True, "data": data.model_dump(mode="json"), "error": None}


@router.post("/legacy-admin")
async def legacy_admin(body: LegacyAdminLoginRequest, db: AsyncSession = Depends(get_db)):
    from app.config import settings

    if not settings.ALLOW_LEGACY_ADMIN:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    try:
        data = await auth_service.legacy_admin_login(db, body.username.strip(), body.password)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
    return {"success": True, "data": data.model_dump(mode="json"), "error": None}


@router.get("/me")
async def me(current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    uid = UUID(current_user["user_id"])
    user = await auth_service.get_user_by_id(db, uid)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return {"success": True, "data": UserPublic.model_validate(user).model_dump(mode="json"), "error": None}


@router.patch("/me/profile")
async def patch_profile(
    body: ProfilePatchRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    uid = UUID(current_user["user_id"])
    user = await auth_service.get_user_by_id(db, uid)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    merged = {**(user.profile_data or {}), **body.profile_data}
    user.profile_data = merged
    await db.commit()
    await db.refresh(user)
    return {"success": True, "data": UserPublic.model_validate(user).model_dump(mode="json"), "error": None}
