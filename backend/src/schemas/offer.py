from datetime import datetime

from pydantic import AliasChoices, BaseModel, Field


class OfferCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str = Field(
        default="",
        max_length=5000,
        validation_alias=AliasChoices("description", "descripton"),
        serialization_alias="description",
    )
    price: float = Field(ge=0)
    requires_all: list[int] = Field(default_factory=list)
    requires_optional: list[int] = Field(default_factory=list)
    excludes: list[int] = Field(
        default_factory=list,
        validation_alias=AliasChoices("excludes", "exludes"),
        serialization_alias="excludes",
    )
    priority: int = 0


class OfferUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = Field(
        default=None,
        max_length=5000,
        validation_alias=AliasChoices("description", "descripton"),
        serialization_alias="description",
    )
    price: float | None = Field(default=None, ge=0)
    requires_all: list[int] | None = None
    requires_optional: list[int] | None = None
    excludes: list[int] | None = Field(
        default=None,
        validation_alias=AliasChoices("excludes", "exludes"),
        serialization_alias="excludes",
    )
    priority: int | None = None


class OfferResponse(BaseModel):
    id: int
    name: str
    description: str
    price: float
    requires_all: list[int]
    requires_optional: list[int]
    excludes: list[int]
    priority: int
    created_at: datetime
    updated_at: datetime


class OffersListResponse(BaseModel):
    items: list[OfferResponse]
    total: int
