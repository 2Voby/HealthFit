from fastapi import APIRouter, Depends, HTTPException, Query, status

from src.api.deps import require_authority
from src.core.flow_history import create_flow_history_for_all_flows
from src.models import Attribute, Offer, User
from src.schemas.offer import (
    OfferCreateRequest,
    OfferResponse,
    OffersListResponse,
    OfferSelectionItem,
    OfferSelectionRequest,
    OfferSelectionResponse,
    OfferUpdateRequest,
)

router = APIRouter(prefix="/offers", tags=["offers"])


def normalize_unique_ids(ids: list[int]) -> list[int]:
    return sorted(set(ids))


def normalize_offer_constraints(
    requires_all_ids: list[int],
    requires_optional_ids: list[int],
    excludes_ids: list[int],
) -> tuple[list[int], list[int], list[int]]:
    normalized_requires_all = normalize_unique_ids(requires_all_ids)
    normalized_requires_optional = normalize_unique_ids(requires_optional_ids)
    normalized_excludes = normalize_unique_ids(excludes_ids)

    # If attr is already in requires_all, keeping it in optional is redundant.
    requires_all_set = set(normalized_requires_all)
    normalized_requires_optional = [
        attr_id for attr_id in normalized_requires_optional if attr_id not in requires_all_set
    ]

    conflict_ids = sorted(
        (set(normalized_requires_all) | set(normalized_requires_optional))
        & set(normalized_excludes)
    )
    if conflict_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Offer constraints conflict: attribute cannot be required and excluded at the same time. "
                f"Conflicting ids: {', '.join(map(str, conflict_ids))}"
            ),
        )

    return normalized_requires_all, normalized_requires_optional, normalized_excludes


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
    requires_all_ids = sorted(attribute.id for attribute in requires_all_attributes)
    requires_optional_ids = sorted(attribute.id for attribute in requires_optional_attributes)
    excludes_ids = sorted(attribute.id for attribute in excludes_attributes)
    requires_all_set = set(requires_all_ids)
    requires_optional_ids = [attr_id for attr_id in requires_optional_ids if attr_id not in requires_all_set]

    return OfferResponse(
        id=offer.id,
        name=offer.name,
        description=offer.description,
        price=offer.price,
        requires_all=requires_all_ids,
        requires_optional=requires_optional_ids,
        excludes=excludes_ids,
        priority=offer.priority,
        created_at=offer.created_at,
        updated_at=offer.updated_at,
    )


async def build_offer_selection_item(
    offer: Offer,
    selected_attribute_ids: set[int],
) -> OfferSelectionItem | None:
    requires_all_attributes = await offer.requires_all.all()
    requires_optional_attributes = await offer.requires_optional.all()
    excludes_attributes = await offer.excludes.all()

    requires_all_ids = sorted(attribute.id for attribute in requires_all_attributes)
    requires_optional_ids = sorted(attribute.id for attribute in requires_optional_attributes)
    excludes_ids = sorted(attribute.id for attribute in excludes_attributes)
    requires_all_set = set(requires_all_ids)
    requires_optional_ids = [attr_id for attr_id in requires_optional_ids if attr_id not in requires_all_set]

    missing_requires_all_ids = [attribute_id for attribute_id in requires_all_ids if attribute_id not in selected_attribute_ids]
    hit_excluded_ids = [attribute_id for attribute_id in excludes_ids if attribute_id in selected_attribute_ids]
    if missing_requires_all_ids or hit_excluded_ids:
        return None

    matched_optional_ids = [attribute_id for attribute_id in requires_optional_ids if attribute_id in selected_attribute_ids]
    missing_optional_ids = [attribute_id for attribute_id in requires_optional_ids if attribute_id not in selected_attribute_ids]
    matched_optional_count = len(matched_optional_ids)
    total_optional_count = len(requires_optional_ids)
    optional_coverage = (matched_optional_count / total_optional_count) if total_optional_count > 0 else 1.0

    # Ranking formula:
    # 1) priority (dominant business signal)
    # 2) optional coverage (how complete recommendation is)
    # 3) specificity (more constrained offer gets slight boost)
    specificity_bonus = len(requires_all_ids) * 500 + total_optional_count * 120
    coverage_bonus = int(optional_coverage * 10_000)
    matched_bonus = matched_optional_count * 250
    score = offer.priority * 1_000_000 + coverage_bonus + specificity_bonus + matched_bonus

    reasoning = [
        f"requires_all matched: {len(requires_all_ids) - len(missing_requires_all_ids)}/{len(requires_all_ids)}",
        f"requires_optional matched: {matched_optional_count}/{total_optional_count}",
        f"requires_optional coverage: {optional_coverage:.2f}",
        f"excludes matched: {len(hit_excluded_ids)}",
    ]

    offer_response = OfferResponse(
        id=offer.id,
        name=offer.name,
        description=offer.description,
        price=offer.price,
        requires_all=requires_all_ids,
        requires_optional=requires_optional_ids,
        excludes=excludes_ids,
        priority=offer.priority,
        created_at=offer.created_at,
        updated_at=offer.updated_at,
    )
    return OfferSelectionItem(
        offer=offer_response,
        score=score,
        matched_optional_count=matched_optional_count,
        total_optional_count=total_optional_count,
        matched_optional_ids=matched_optional_ids,
        missing_optional_ids=missing_optional_ids,
        optional_coverage=optional_coverage,
        missing_requires_all_ids=missing_requires_all_ids,
        hit_excluded_ids=hit_excluded_ids,
        reasoning=reasoning,
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


@router.post("/selection", response_model=OfferSelectionResponse)
async def select_offers(payload: OfferSelectionRequest) -> OfferSelectionResponse:
    selected_attributes = await resolve_attributes(payload.attributes)
    selected_attribute_ids = sorted(attribute.id for attribute in selected_attributes)
    selected_attribute_ids_set = set(selected_attribute_ids)

    offers = await Offer.all().prefetch_related("requires_all", "requires_optional", "excludes")
    eligible_items: list[OfferSelectionItem] = []
    for offer in offers:
        item = await build_offer_selection_item(offer, selected_attribute_ids_set)
        if item:
            eligible_items.append(item)

    eligible_items.sort(key=lambda item: (-item.score, -item.offer.priority, item.offer.id))
    limited_items = eligible_items[: payload.limit]
    return OfferSelectionResponse(
        requested_attributes=selected_attribute_ids,
        total_considered=len(offers),
        total_eligible=len(eligible_items),
        items=limited_items,
    )


@router.post("/", response_model=OfferResponse, status_code=status.HTTP_201_CREATED)
async def create_offer(
    payload: OfferCreateRequest,
    current_user: User = Depends(require_authority("edit_elements")),
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

    normalized_requires_all, normalized_requires_optional, normalized_excludes = normalize_offer_constraints(
        payload.requires_all,
        payload.requires_optional,
        payload.excludes,
    )

    requires_all_attributes = await resolve_attributes(normalized_requires_all)
    requires_optional_attributes = await resolve_attributes(normalized_requires_optional)
    excludes_attributes = await resolve_attributes(normalized_excludes)

    if requires_all_attributes:
        await offer.requires_all.add(*requires_all_attributes)
    if requires_optional_attributes:
        await offer.requires_optional.add(*requires_optional_attributes)
    if excludes_attributes:
        await offer.excludes.add(*excludes_attributes)

    await create_flow_history_for_all_flows(changed_by_user=current_user)
    return await to_offer_response(offer)


@router.patch("/{offer_id}", response_model=OfferResponse)
async def update_offer(
    offer_id: int,
    payload: OfferUpdateRequest,
    current_user: User = Depends(require_authority("edit_elements")),
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

    if payload.requires_all is not None or payload.requires_optional is not None or payload.excludes is not None:
        current_requires_all_ids = sorted(attribute.id for attribute in await offer.requires_all.all())
        current_requires_optional_ids = sorted(attribute.id for attribute in await offer.requires_optional.all())
        current_excludes_ids = sorted(attribute.id for attribute in await offer.excludes.all())

        effective_requires_all = payload.requires_all if payload.requires_all is not None else current_requires_all_ids
        effective_requires_optional = (
            payload.requires_optional if payload.requires_optional is not None else current_requires_optional_ids
        )
        effective_excludes = payload.excludes if payload.excludes is not None else current_excludes_ids

        normalized_requires_all, normalized_requires_optional, normalized_excludes = normalize_offer_constraints(
            effective_requires_all,
            effective_requires_optional,
            effective_excludes,
        )

        if payload.requires_all is not None:
            requires_all_attributes = await resolve_attributes(normalized_requires_all)
            await offer.requires_all.clear()
            if requires_all_attributes:
                await offer.requires_all.add(*requires_all_attributes)

        if payload.requires_optional is not None:
            requires_optional_attributes = await resolve_attributes(normalized_requires_optional)
            await offer.requires_optional.clear()
            if requires_optional_attributes:
                await offer.requires_optional.add(*requires_optional_attributes)

        if payload.excludes is not None:
            excludes_attributes = await resolve_attributes(normalized_excludes)
            await offer.excludes.clear()
            if excludes_attributes:
                await offer.excludes.add(*excludes_attributes)

    await create_flow_history_for_all_flows(changed_by_user=current_user)
    return await to_offer_response(offer)


@router.delete("/{offer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_offer(
    offer_id: int,
    current_user: User = Depends(require_authority("edit_elements")),
) -> None:
    offer = await Offer.get_or_none(id=offer_id)
    if offer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer not found")
    await offer.delete()
    await create_flow_history_for_all_flows(changed_by_user=current_user)
