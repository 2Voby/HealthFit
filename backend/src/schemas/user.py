from pydantic import BaseModel, Field


class UserCreateRequest(BaseModel):
    login: str = Field(min_length=3, max_length=100)
    password: str = Field(min_length=8, max_length=128)
    authorities: list[str] = Field(default_factory=list)


class UserUpdateRequest(BaseModel):
    login: str | None = Field(default=None, min_length=3, max_length=100)
    password: str | None = Field(default=None, min_length=8, max_length=128)
    authorities: list[str] | None = None


class UserResponse(BaseModel):
    id: int
    login: str
    authorities: list[str]


class UsersListResponse(BaseModel):
    items: list[UserResponse]
    total: int
