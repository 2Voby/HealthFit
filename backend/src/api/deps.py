from __future__ import annotations

from fastapi import Depends, HTTPException, Request, status

from src.core.config import Settings, get_settings
from src.core.redis import get_session_user_id
from src.models import User
from src.schemas.user import UserResponse


async def to_user_response(user: User) -> UserResponse:
    authorities = await user.authorities.all()
    return UserResponse(
        id=user.id,
        login=user.login,
        authorities=[authority.name for authority in authorities],
    )


async def get_current_user(
    request: Request,
    settings: Settings = Depends(get_settings),
) -> User:
    session_id = request.cookies.get(settings.session_cookie_name)
    if not session_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    user_id = await get_session_user_id(session_id)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session",
        )

    user = await User.get_or_none(id=user_id).prefetch_related("authorities")
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found for session",
        )

    return user


def require_authority(authority_name: str):
    async def dependency(current_user: User = Depends(get_current_user)) -> User:
        authorities = await current_user.authorities.all()
        user_authorities = {authority.name for authority in authorities}
        if authority_name not in user_authorities:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing authority: {authority_name}",
            )
        return current_user

    return dependency
