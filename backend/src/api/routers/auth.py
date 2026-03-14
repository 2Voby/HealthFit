from fastapi import APIRouter, Depends, HTTPException, Request, Response, status

from src.api.deps import get_current_user, to_user_response
from src.core.config import Settings, get_settings
from src.core.redis import create_session, delete_session
from src.core.security import hash_password, verify_password
from src.models import User
from src.schemas.auth import LoginRequest, RegisterRequest
from src.schemas.user import UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])


def set_session_cookie(response: Response, settings: Settings, session_id: str) -> None:
    response.set_cookie(
        key=settings.session_cookie_name,
        value=session_id,
        httponly=True,
        secure=settings.session_cookie_secure,
        samesite=settings.session_cookie_samesite,
        max_age=settings.session_ttl_seconds,
        path="/",
    )


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: RegisterRequest,
    response: Response,
    settings: Settings = Depends(get_settings),
) -> UserResponse:
    existing = await User.get_or_none(login=payload.login)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this login already exists",
        )

    user = await User.create(
        login=payload.login,
        password_hash=hash_password(payload.password),
    )
    await user.fetch_related("authorities")

    session_id = await create_session(user.id, settings.session_ttl_seconds)
    set_session_cookie(response, settings, session_id)
    return await to_user_response(user)


@router.post("/login", response_model=UserResponse)
async def login(
    payload: LoginRequest,
    response: Response,
    settings: Settings = Depends(get_settings),
) -> UserResponse:
    user = await User.get_or_none(login=payload.login).prefetch_related("authorities")
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid login or password",
        )

    session_id = await create_session(user.id, settings.session_ttl_seconds)
    set_session_cookie(response, settings, session_id)
    return await to_user_response(user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    request: Request,
    response: Response,
    settings: Settings = Depends(get_settings),
) -> None:
    session_id = request.cookies.get(settings.session_cookie_name)
    if session_id:
        await delete_session(session_id)

    response.delete_cookie(key=settings.session_cookie_name, path="/")


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)) -> UserResponse:
    return await to_user_response(current_user)
