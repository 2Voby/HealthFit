from fastapi import APIRouter, Depends, HTTPException, Query, status

from src.api.deps import require_authority
from src.models import (
    Flow,
    FlowHistory,
    FlowQuestion,
    FlowTransition,
    FlowTransitionAnswer,
    Question,
    QuestionAnswer,
    User,
)
from src.schemas.flow import (
    FlowCreateRequest,
    FlowHistoryAction,
    FlowHistoryEntryResponse,
    FlowHistoryListResponse,
    FlowQuestionResponse,
    FlowResolveNextRequest,
    FlowResolveNextResponse,
    FlowResponse,
    FlowSnapshot,
    FlowTransitionCondition,
    FlowTransitionCreateRequest,
    FlowTransitionResponse,
    FlowsListResponse,
    FlowUpdateRequest,
)
from src.schemas.question import QuestionAnswerResponse, QuestionResponse

router = APIRouter(prefix="/flows", tags=["flows"])


def question_type_value(question_type: object) -> str:
    if hasattr(question_type, "value"):
        return str(getattr(question_type, "value"))
    return str(question_type)


def transition_condition_value(condition_type: object) -> str:
    if hasattr(condition_type, "value"):
        return str(getattr(condition_type, "value"))
    return str(condition_type)


def flow_history_action_value(action: object) -> str:
    if hasattr(action, "value"):
        return str(getattr(action, "value"))
    return str(action)


async def to_question_response(question: Question) -> QuestionResponse:
    answers = await QuestionAnswer.filter(question=question).order_by("id").prefetch_related("attributes")
    response_answers: list[QuestionAnswerResponse] = []
    for answer in answers:
        answer_attributes = await answer.attributes.all()
        response_answers.append(
            QuestionAnswerResponse(
                id=answer.id,
                text=answer.text,
                attributes=sorted(attribute.id for attribute in answer_attributes),
                created_at=answer.created_at,
                updated_at=answer.updated_at,
            )
        )

    return QuestionResponse(
        id=question.id,
        text=question.text,
        type=question_type_value(question.type),
        requires=question.requires,
        answers=response_answers,
        created_at=question.created_at,
        updated_at=question.updated_at,
    )


async def resolve_questions_by_ids(question_ids: list[int]) -> dict[int, Question]:
    if not question_ids:
        return {}

    if len(set(question_ids)) != len(question_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="question_ids must contain unique values",
        )

    unique_ids = sorted(set(question_ids))
    questions = await Question.filter(id__in=unique_ids)
    question_map = {question.id: question for question in questions}
    missing_ids = [question_id for question_id in unique_ids if question_id not in question_map]
    if missing_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown question ids: {', '.join(map(str, missing_ids))}",
        )
    return question_map


async def resolve_answers_by_ids(answer_ids: list[int]) -> dict[int, QuestionAnswer]:
    if not answer_ids:
        return {}

    if len(set(answer_ids)) != len(answer_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="answer_ids must contain unique values",
        )

    unique_ids = sorted(set(answer_ids))
    answers = await QuestionAnswer.filter(id__in=unique_ids)
    answer_map = {answer.id: answer for answer in answers}
    missing_ids = [answer_id for answer_id in unique_ids if answer_id not in answer_map]
    if missing_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown answer ids: {', '.join(map(str, missing_ids))}",
        )
    return answer_map


def normalize_unique_ids(ids: list[int]) -> list[int]:
    return sorted(set(ids))


async def get_flow_question_map(flow: Flow) -> dict[int, Question]:
    flow_questions = await FlowQuestion.filter(flow=flow).order_by("position")
    question_ids = [item.question_id for item in flow_questions]
    return await resolve_questions_by_ids(question_ids)


async def set_flow_questions(
    flow: Flow,
    question_ids: list[int],
    question_map: dict[int, Question] | None = None,
) -> None:
    if question_map is None:
        question_map = await resolve_questions_by_ids(question_ids)

    await FlowQuestion.filter(flow=flow).delete()
    for position, question_id in enumerate(question_ids, start=1):
        await FlowQuestion.create(
            flow=flow,
            question_id=question_id,
            position=position,
        )


def validate_transition_payload(payload: FlowTransitionCreateRequest) -> None:
    if payload.condition_type == FlowTransitionCondition.always and payload.answer_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="answer_ids must be empty when condition_type is always",
        )
    if payload.condition_type in {FlowTransitionCondition.answer_any, FlowTransitionCondition.answer_all}:
        if not payload.answer_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="answer_ids are required for answer_any and answer_all conditions",
            )


async def set_flow_transitions(
    flow: Flow,
    transitions: list[FlowTransitionCreateRequest],
    question_map: dict[int, Question],
) -> None:
    prepared_transitions: list[tuple[FlowTransitionCreateRequest, list[QuestionAnswer]]] = []

    for transition_payload in transitions:
        validate_transition_payload(transition_payload)

        from_question = question_map.get(transition_payload.from_question_id)
        if from_question is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"from_question_id {transition_payload.from_question_id} is not part of this flow",
            )

        if transition_payload.to_question_id is not None and transition_payload.to_question_id not in question_map:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"to_question_id {transition_payload.to_question_id} is not part of this flow",
            )

        answer_map = await resolve_answers_by_ids(transition_payload.answer_ids)
        for answer in answer_map.values():
            if answer.question_id != transition_payload.from_question_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Answer {answer.id} does not belong to from_question_id "
                        f"{transition_payload.from_question_id}"
                    ),
                )
        prepared_transitions.append((transition_payload, list(answer_map.values())))

    await FlowTransition.filter(flow=flow).delete()

    for transition_payload, answers in prepared_transitions:
        transition = await FlowTransition.create(
            flow=flow,
            from_question_id=transition_payload.from_question_id,
            to_question_id=transition_payload.to_question_id,
            condition_type=transition_payload.condition_type.value,
            priority=transition_payload.priority,
        )
        for answer in answers:
            await FlowTransitionAnswer.create(
                transition=transition,
                answer=answer,
            )


async def ensure_only_one_active(active_flow_id: int) -> None:
    await Flow.all().update(is_active=False)
    await Flow.filter(id=active_flow_id).update(is_active=True)


async def to_flow_snapshot(flow: Flow) -> FlowSnapshot:
    flow_questions = await FlowQuestion.filter(flow=flow).order_by("position")
    question_ids = [item.question_id for item in flow_questions]

    transitions = await FlowTransition.filter(flow=flow).order_by("from_question_id", "priority", "id")
    transition_ids = [transition.id for transition in transitions]
    answer_rows = []
    if transition_ids:
        answer_rows = await FlowTransitionAnswer.filter(transition_id__in=transition_ids).order_by(
            "transition_id",
            "answer_id",
        )

    transition_answers_map: dict[int, list[int]] = {}
    for row in answer_rows:
        transition_answers_map.setdefault(row.transition_id, []).append(row.answer_id)

    transition_payloads = []
    for transition in transitions:
        transition_payloads.append(
            FlowTransitionCreateRequest(
                from_question_id=transition.from_question_id,
                to_question_id=transition.to_question_id,
                condition_type=transition_condition_value(transition.condition_type),
                answer_ids=transition_answers_map.get(transition.id, []),
                priority=transition.priority,
            )
        )

    return FlowSnapshot(
        name=flow.name,
        is_active=flow.is_active,
        question_ids=question_ids,
        transitions=transition_payloads,
    )


async def get_next_flow_revision(flow_id: int) -> int:
    latest_history_entry = await FlowHistory.filter(flow_id=flow_id).order_by("-revision").first()
    if latest_history_entry is None:
        return 1
    return latest_history_entry.revision + 1


async def create_flow_history_entry(
    flow: Flow,
    action: FlowHistoryAction,
    changed_by_user: User | None,
    source_revision: int | None = None,
) -> FlowHistory:
    snapshot = await to_flow_snapshot(flow)
    return await FlowHistory.create(
        flow=flow,
        revision=await get_next_flow_revision(flow.id),
        action=action.value,
        snapshot=snapshot.model_dump(mode="json"),
        source_revision=source_revision,
        changed_by_user=changed_by_user,
    )


async def to_flow_history_entry_response(entry: FlowHistory) -> FlowHistoryEntryResponse:
    return FlowHistoryEntryResponse(
        id=entry.id,
        flow_id=entry.flow_id,
        revision=entry.revision,
        action=flow_history_action_value(entry.action),
        source_revision=entry.source_revision,
        changed_by_user_id=entry.changed_by_user_id,
        snapshot=FlowSnapshot.model_validate(entry.snapshot),
        created_at=entry.created_at,
        updated_at=entry.updated_at,
    )


def transition_matches(
    condition_type: str,
    transition_answer_ids: set[int],
    selected_answer_ids: set[int],
) -> bool:
    if condition_type == FlowTransitionCondition.always.value:
        return True
    if condition_type == FlowTransitionCondition.answer_any.value:
        return any(answer_id in selected_answer_ids for answer_id in transition_answer_ids)
    if condition_type == FlowTransitionCondition.answer_all.value:
        return transition_answer_ids.issubset(selected_answer_ids)
    return False


async def resolve_next_for_flow(
    flow: Flow,
    payload: FlowResolveNextRequest,
) -> FlowResolveNextResponse:
    question_map = await get_flow_question_map(flow)
    current_question = question_map.get(payload.current_question_id)
    if current_question is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"current_question_id {payload.current_question_id} is not part of this flow",
        )

    selected_answer_ids = normalize_unique_ids(payload.selected_answer_ids)
    if len(selected_answer_ids) != len(payload.selected_answer_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="selected_answer_ids must contain unique values",
        )

    current_question_type = question_type_value(current_question.type)
    if current_question_type in {"manual_input", "text"} and selected_answer_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{current_question_type} question must not contain selected_answer_ids",
        )
    if current_question_type == "singe_choise" and len(selected_answer_ids) > 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="singe_choise question accepts at most one selected answer",
        )

    selected_answer_map = await resolve_answers_by_ids(selected_answer_ids)
    for answer in selected_answer_map.values():
        if answer.question_id != current_question.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Answer {answer.id} does not belong to current_question_id {current_question.id}",
            )

    transitions = await FlowTransition.filter(
        flow=flow,
        from_question_id=current_question.id,
    ).order_by("priority", "id")
    transition_ids = [transition.id for transition in transitions]
    answer_rows = []
    if transition_ids:
        answer_rows = await FlowTransitionAnswer.filter(transition_id__in=transition_ids).order_by(
            "transition_id",
            "answer_id",
        )

    transition_answers_map: dict[int, set[int]] = {}
    for row in answer_rows:
        transition_answers_map.setdefault(row.transition_id, set()).add(row.answer_id)

    selected_answer_ids_set = set(selected_answer_ids)
    matched_transition: FlowTransition | None = None
    for transition in transitions:
        condition_type = transition_condition_value(transition.condition_type)
        transition_answer_ids = transition_answers_map.get(transition.id, set())
        if transition_matches(condition_type, transition_answer_ids, selected_answer_ids_set):
            matched_transition = transition
            break

    next_question_id = matched_transition.to_question_id if matched_transition else None
    next_question = question_map.get(next_question_id) if next_question_id is not None else None
    is_finished = next_question_id is None

    return FlowResolveNextResponse(
        flow_id=flow.id,
        current_question_id=current_question.id,
        selected_answer_ids=selected_answer_ids,
        matched_transition_id=matched_transition.id if matched_transition else None,
        next_question_id=next_question_id,
        is_finished=is_finished,
        next_question=await to_question_response(next_question) if next_question is not None else None,
    )


async def to_flow_response(flow: Flow) -> FlowResponse:
    flow_questions = await FlowQuestion.filter(flow=flow).order_by("position")
    question_ids = [item.question_id for item in flow_questions]
    questions = await Question.filter(id__in=question_ids)
    question_map = {question.id: question for question in questions}

    response_questions: list[FlowQuestionResponse] = []
    for item in flow_questions:
        question = question_map.get(item.question_id)
        if question is None:
            continue

        response_questions.append(
            FlowQuestionResponse(
                question_id=question.id,
                position=item.position,
                question=await to_question_response(question),
            )
        )

    transitions = await FlowTransition.filter(flow=flow).order_by("from_question_id", "priority", "id")
    response_transitions: list[FlowTransitionResponse] = []
    for transition in transitions:
        transition_answer_rows = await FlowTransitionAnswer.filter(transition=transition).order_by("answer_id")
        response_transitions.append(
            FlowTransitionResponse(
                id=transition.id,
                from_question_id=transition.from_question_id,
                to_question_id=transition.to_question_id,
                condition_type=transition_condition_value(transition.condition_type),
                answer_ids=[row.answer_id for row in transition_answer_rows],
                priority=transition.priority,
                created_at=transition.created_at,
                updated_at=transition.updated_at,
            )
        )

    start_question_id = flow_questions[0].question_id if flow_questions else None
    return FlowResponse(
        id=flow.id,
        name=flow.name,
        is_active=flow.is_active,
        start_question_id=start_question_id,
        questions=response_questions,
        transitions=response_transitions,
        created_at=flow.created_at,
        updated_at=flow.updated_at,
    )


@router.get("/", response_model=FlowsListResponse)
async def list_flows(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
) -> FlowsListResponse:
    total = await Flow.all().count()
    flows = await Flow.all().order_by("-is_active", "id").offset(offset).limit(limit)
    return FlowsListResponse(
        items=[await to_flow_response(flow) for flow in flows],
        total=total,
    )


@router.get("/active", response_model=FlowResponse)
async def get_active_flow() -> FlowResponse:
    active_flow = await Flow.filter(is_active=True).first()
    if active_flow is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Active flow not found")
    return await to_flow_response(active_flow)


@router.get("/{flow_id}", response_model=FlowResponse)
async def get_flow(flow_id: int) -> FlowResponse:
    flow = await Flow.get_or_none(id=flow_id)
    if flow is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flow not found")
    return await to_flow_response(flow)


@router.get("/{flow_id}/history", response_model=FlowHistoryListResponse)
async def list_flow_history(
    flow_id: int,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
) -> FlowHistoryListResponse:
    flow = await Flow.get_or_none(id=flow_id)
    if flow is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flow not found")

    total = await FlowHistory.filter(flow=flow).count()
    history_items = await FlowHistory.filter(flow=flow).order_by("-revision").offset(offset).limit(limit)
    return FlowHistoryListResponse(
        items=[await to_flow_history_entry_response(item) for item in history_items],
        total=total,
    )


@router.get("/{flow_id}/history/{revision}", response_model=FlowHistoryEntryResponse)
async def get_flow_history_entry(flow_id: int, revision: int) -> FlowHistoryEntryResponse:
    flow = await Flow.get_or_none(id=flow_id)
    if flow is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flow not found")

    history_entry = await FlowHistory.filter(flow=flow, revision=revision).first()
    if history_entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flow history entry not found")
    return await to_flow_history_entry_response(history_entry)


@router.post("/active/next", response_model=FlowResolveNextResponse)
async def resolve_active_flow_next(payload: FlowResolveNextRequest) -> FlowResolveNextResponse:
    flow = await Flow.filter(is_active=True).first()
    if flow is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Active flow not found")
    return await resolve_next_for_flow(flow=flow, payload=payload)


@router.post("/{flow_id}/next", response_model=FlowResolveNextResponse)
async def resolve_flow_next(flow_id: int, payload: FlowResolveNextRequest) -> FlowResolveNextResponse:
    flow = await Flow.get_or_none(id=flow_id)
    if flow is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flow not found")
    return await resolve_next_for_flow(flow=flow, payload=payload)


@router.post("/{flow_id}/rollback/{revision}", response_model=FlowResponse)
async def rollback_flow_to_revision(
    flow_id: int,
    revision: int,
    current_user: User = Depends(require_authority("edit_elements")),
) -> FlowResponse:
    flow = await Flow.get_or_none(id=flow_id)
    if flow is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flow not found")

    history_entry = await FlowHistory.filter(flow=flow, revision=revision).first()
    if history_entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flow history entry not found")

    snapshot = FlowSnapshot.model_validate(history_entry.snapshot)
    if snapshot.name != flow.name:
        conflict = await Flow.get_or_none(name=snapshot.name)
        if conflict and conflict.id != flow.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cannot rollback flow name due to existing flow with this name",
            )

    question_map = await resolve_questions_by_ids(snapshot.question_ids)

    flow.name = snapshot.name
    flow.is_active = snapshot.is_active
    await flow.save()

    await set_flow_questions(flow=flow, question_ids=snapshot.question_ids, question_map=question_map)
    await set_flow_transitions(flow=flow, transitions=snapshot.transitions, question_map=question_map)

    if flow.is_active:
        await ensure_only_one_active(flow.id)
        flow.is_active = True

    await flow.refresh_from_db()
    await create_flow_history_entry(
        flow=flow,
        action=FlowHistoryAction.rollback,
        changed_by_user=current_user,
        source_revision=history_entry.revision,
    )
    return await to_flow_response(flow)


@router.post("/", response_model=FlowResponse, status_code=status.HTTP_201_CREATED)
async def create_flow(
    payload: FlowCreateRequest,
    current_user: User = Depends(require_authority("edit_elements")),
) -> FlowResponse:
    existing = await Flow.get_or_none(name=payload.name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Flow with this name already exists",
        )

    question_map = await resolve_questions_by_ids(payload.question_ids)
    flow = await Flow.create(
        name=payload.name,
        is_active=payload.is_active,
    )

    await set_flow_questions(flow=flow, question_ids=payload.question_ids, question_map=question_map)
    await set_flow_transitions(flow=flow, transitions=payload.transitions, question_map=question_map)

    if flow.is_active:
        await ensure_only_one_active(flow.id)

    await flow.refresh_from_db()
    await create_flow_history_entry(
        flow=flow,
        action=FlowHistoryAction.create,
        changed_by_user=current_user,
    )
    return await to_flow_response(flow)


@router.patch("/{flow_id}", response_model=FlowResponse)
async def update_flow(
    flow_id: int,
    payload: FlowUpdateRequest,
    current_user: User = Depends(require_authority("edit_elements")),
) -> FlowResponse:
    flow = await Flow.get_or_none(id=flow_id)
    if flow is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flow not found")

    if payload.name and payload.name != flow.name:
        conflict = await Flow.get_or_none(name=payload.name)
        if conflict and conflict.id != flow.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Flow with this name already exists",
            )
        flow.name = payload.name

    question_map = await get_flow_question_map(flow)
    if payload.question_ids is not None:
        question_map = await resolve_questions_by_ids(payload.question_ids)
        await set_flow_questions(flow=flow, question_ids=payload.question_ids, question_map=question_map)
        if payload.transitions is None:
            # If question set changed and transitions are not provided, clear branches to avoid stale paths.
            await FlowTransition.filter(flow=flow).delete()

    if payload.transitions is not None:
        await set_flow_transitions(flow=flow, transitions=payload.transitions, question_map=question_map)

    if payload.is_active is False:
        flow.is_active = False
    elif payload.is_active is True:
        flow.is_active = True

    await flow.save()

    if flow.is_active:
        await ensure_only_one_active(flow.id)
        flow.is_active = True

    await flow.refresh_from_db()
    await create_flow_history_entry(
        flow=flow,
        action=FlowHistoryAction.update,
        changed_by_user=current_user,
    )
    return await to_flow_response(flow)


@router.delete("/{flow_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_flow(
    flow_id: int,
    _: User = Depends(require_authority("edit_elements")),
) -> None:
    flow = await Flow.get_or_none(id=flow_id)
    if flow is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flow not found")
    await flow.delete()
