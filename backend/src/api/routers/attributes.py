from fastapi import APIRouter, Depends, HTTPException, Query, status

from src.api.deps import require_authority
from src.core.flow_history import create_flow_history_for_all_flows
from src.models import Attribute, User
from src.schemas.attribute import (
    AttributeCreateRequest,
    AttributeResponse,
    AttributesListResponse,
    AttributeUpdateRequest,
)

router = APIRouter(prefix="/attributes", tags=["attributes"])


def to_attribute_response(attribute: Attribute) -> AttributeResponse:
    return AttributeResponse(
        id=attribute.id,
        name=attribute.name,
        created_at=attribute.created_at,
        updated_at=attribute.updated_at,
    )


@router.get("/", response_model=AttributesListResponse)
async def list_attributes(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
) -> AttributesListResponse:
    total = await Attribute.all().count()
    attributes = await Attribute.all().order_by("id").offset(offset).limit(limit)
    return AttributesListResponse(
        items=[to_attribute_response(attribute) for attribute in attributes],
        total=total,
    )


@router.get("/{attribute_id}", response_model=AttributeResponse)
async def get_attribute(
    attribute_id: int,
) -> AttributeResponse:
    attribute = await Attribute.get_or_none(id=attribute_id)
    if attribute is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attribute not found")
    return to_attribute_response(attribute)


@router.post("/", response_model=AttributeResponse, status_code=status.HTTP_201_CREATED)
async def create_attribute(
    payload: AttributeCreateRequest,
    current_user: User = Depends(require_authority("edit_elements")),
) -> AttributeResponse:
    existing = await Attribute.get_or_none(name=payload.name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Attribute with this name already exists",
        )

    attribute = await Attribute.create(name=payload.name)
    await create_flow_history_for_all_flows(changed_by_user=current_user)
    return to_attribute_response(attribute)


@router.patch("/{attribute_id}", response_model=AttributeResponse)
async def update_attribute(
    attribute_id: int,
    payload: AttributeUpdateRequest,
    current_user: User = Depends(require_authority("edit_elements")),
) -> AttributeResponse:
    attribute = await Attribute.get_or_none(id=attribute_id)
    if attribute is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attribute not found")

    if payload.name and payload.name != attribute.name:
        conflict = await Attribute.get_or_none(name=payload.name)
        if conflict and conflict.id != attribute.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Attribute with this name already exists",
            )
        attribute.name = payload.name

    await attribute.save()
    await create_flow_history_for_all_flows(changed_by_user=current_user)
    return to_attribute_response(attribute)


@router.delete("/{attribute_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_attribute(
    attribute_id: int,
    current_user: User = Depends(require_authority("edit_elements")),
) -> None:
    attribute = await Attribute.get_or_none(id=attribute_id)
    if attribute is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attribute not found")
    await attribute.delete()
    await create_flow_history_for_all_flows(changed_by_user=current_user)
