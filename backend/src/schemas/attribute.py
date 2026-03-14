from datetime import datetime

from pydantic import BaseModel, Field


class AttributeCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)


class AttributeUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)


class AttributeResponse(BaseModel):
    id: int
    name: str
    created_at: datetime
    updated_at: datetime


class AttributesListResponse(BaseModel):
    items: list[AttributeResponse]
    total: int
