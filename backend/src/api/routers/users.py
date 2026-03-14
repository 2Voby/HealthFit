from fastapi import APIRouter, Depends, HTTPException, Query, status

from src.api.deps import require_authority, to_user_response
from src.core.security import hash_password
from src.models import Authority, User
from src.schemas.user import UserCreateRequest, UserResponse, UsersListResponse, UserUpdateRequest

router = APIRouter(prefix="/users", tags=["users"])


async def resolve_authorities(authority_names: list[str]) -> list[Authority]:
    if not authority_names:
        return []

    unique_names = sorted(set(authority_names))
    authorities = await Authority.filter(name__in=unique_names)
    found_names = {authority.name for authority in authorities}
    missing_names = [name for name in unique_names if name not in found_names]
    if missing_names:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown authorities: {', '.join(missing_names)}",
        )
    return authorities


@router.get("/", response_model=UsersListResponse)
async def list_users(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
) -> UsersListResponse:
    total = await User.all().count()
    users = await User.all().offset(offset).limit(limit).prefetch_related("authorities")
    return UsersListResponse(
        items=[await to_user_response(user) for user in users],
        total=total,
    )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
) -> UserResponse:
    user = await User.get_or_none(id=user_id).prefetch_related("authorities")
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return await to_user_response(user)


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    payload: UserCreateRequest,
    _: User = Depends(require_authority("edit_elements")),
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

    authorities = await resolve_authorities(payload.authorities)
    if authorities:
        await user.authorities.add(*authorities)

    return await to_user_response(user)


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    payload: UserUpdateRequest,
    _: User = Depends(require_authority("edit_elements")),
) -> UserResponse:
    user = await User.get_or_none(id=user_id).prefetch_related("authorities")
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if payload.login and payload.login != user.login:
        conflict = await User.get_or_none(login=payload.login)
        if conflict and conflict.id != user.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User with this login already exists",
            )
        user.login = payload.login

    if payload.password:
        user.password_hash = hash_password(payload.password)

    await user.save()

    if payload.authorities is not None:
        authorities = await resolve_authorities(payload.authorities)
        await user.authorities.clear()
        if authorities:
            await user.authorities.add(*authorities)

    return await to_user_response(user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    _: User = Depends(require_authority("edit_elements")),
) -> None:
    user = await User.get_or_none(id=user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    await user.delete()
