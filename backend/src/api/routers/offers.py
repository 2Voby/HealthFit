from fastapi import APIRouter, Depends, HTTPException, Query, status

from src.api.deps import require_authority
from src.models import Attribute, Offer, User
from src.schemas.offer import OfferCreateRequest, OfferResponse, OffersListResponse, OfferUpdateRequest

router = APIRouter(prefix="/offers", tags=["offers"])


def normalize_unique_ids(ids: list[int]) -> list[int]:
    return sorted(set(ids))


async def resolve_attributes(attribute_ids: list[int]) -> list[Attribute]:
    if not attribute_ids:
        return []

    unique_ids = normalize_unique_ids(attribute_ids)
    attributes = await Attribute.filter(id__in=unique_ids)
    found_ids = {attribute.id for attribute in attributes}
    missing_ids = [attribute_id for attribute_id in unique_ids if attribute_id not in found_ids]
    if missing_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown attribute ids: {', '.join(map(str, missing_ids))}",
        )
    return attributes


async def to_offer_response(offer: Offer) -> OfferResponse:
    requires_all_attributes = await offer.requires_all.all()
    requires_optional_attributes = await offer.requires_optional.all()
    excludes_attributes = await offer.excludes.all()

    return OfferResponse(
        id=offer.id,
        name=offer.name,
        description=offer.description,
        price=offer.price,
        requires_all=sorted(attribute.id for attribute in requires_all_attributes),
        requires_optional=sorted(attribute.id for attribute in requires_optional_attributes),
        excludes=sorted(attribute.id for attribute in excludes_attributes),
        priority=offer.priority,
        created_at=offer.created_at,
        updated_at=offer.updated_at,
    )


@router.get("/", response_model=OffersListResponse)
async def list_offers(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
) -> OffersListResponse:
    total = await Offer.all().count()
    offers = await Offer.all().order_by("id").offset(offset).limit(limit)
    return OffersListResponse(
        items=[await to_offer_response(offer) for offer in offers],
        total=total,
    )


@router.get("/{offer_id}", response_model=OfferResponse)
async def get_offer(
    offer_id: int,
) -> OfferResponse:
    offer = await Offer.get_or_none(id=offer_id)
    if offer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer not found")
    return await to_offer_response(offer)


@router.post("/", response_model=OfferResponse, status_code=status.HTTP_201_CREATED)
async def create_offer(
    payload: OfferCreateRequest,
    _: User = Depends(require_authority("edit_elements")),
) -> OfferResponse:
    existing = await Offer.get_or_none(name=payload.name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Offer with this name already exists",
        )

    offer = await Offer.create(
        name=payload.name,
        description=payload.description,
        price=payload.price,
        priority=payload.priority,
    )

    requires_all_attributes = await resolve_attributes(payload.requires_all)
    requires_optional_attributes = await resolve_attributes(payload.requires_optional)
    excludes_attributes = await resolve_attributes(payload.excludes)

    if requires_all_attributes:
        await offer.requires_all.add(*requires_all_attributes)
    if requires_optional_attributes:
        await offer.requires_optional.add(*requires_optional_attributes)
    if excludes_attributes:
        await offer.excludes.add(*excludes_attributes)

    return await to_offer_response(offer)


@router.patch("/{offer_id}", response_model=OfferResponse)
async def update_offer(
    offer_id: int,
    payload: OfferUpdateRequest,
    _: User = Depends(require_authority("edit_elements")),
) -> OfferResponse:
    offer = await Offer.get_or_none(id=offer_id)
    if offer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer not found")

    if payload.name and payload.name != offer.name:
        conflict = await Offer.get_or_none(name=payload.name)
        if conflict and conflict.id != offer.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Offer with this name already exists",
            )
        offer.name = payload.name

    if payload.description is not None:
        offer.description = payload.description
    if payload.price is not None:
        offer.price = payload.price
    if payload.priority is not None:
        offer.priority = payload.priority

    await offer.save()

    if payload.requires_all is not None:
        requires_all_attributes = await resolve_attributes(payload.requires_all)
        await offer.requires_all.clear()
        if requires_all_attributes:
            await offer.requires_all.add(*requires_all_attributes)

    if payload.requires_optional is not None:
        requires_optional_attributes = await resolve_attributes(payload.requires_optional)
        await offer.requires_optional.clear()
        if requires_optional_attributes:
            await offer.requires_optional.add(*requires_optional_attributes)

    if payload.excludes is not None:
        excludes_attributes = await resolve_attributes(payload.excludes)
        await offer.excludes.clear()
        if excludes_attributes:
            await offer.excludes.add(*excludes_attributes)

    return await to_offer_response(offer)


@router.delete("/{offer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_offer(
    offer_id: int,
    _: User = Depends(require_authority("edit_elements")),
) -> None:
    offer = await Offer.get_or_none(id=offer_id)
    if offer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer not found")
    await offer.delete()
