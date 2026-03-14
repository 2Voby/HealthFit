from fastapi import APIRouter, Depends, HTTPException, Query, status

from src.api.deps import require_authority
from src.models import Flow, FlowQuestion, Question, QuestionAnswer, User
from src.schemas.flow import (
    FlowCreateRequest,
    FlowQuestionResponse,
    FlowResponse,
    FlowsListResponse,
    FlowUpdateRequest,
)
from src.schemas.question import QuestionAnswerResponse, QuestionResponse

router = APIRouter(prefix="/flows", tags=["flows"])


def question_type_value(question_type: object) -> str:
    if hasattr(question_type, "value"):
        return str(getattr(question_type, "value"))
    return str(question_type)


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


async def ensure_only_one_active(active_flow_id: int) -> None:
    await Flow.all().update(is_active=False)
    await Flow.filter(id=active_flow_id).update(is_active=True)


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

    return FlowResponse(
        id=flow.id,
        name=flow.name,
        is_active=flow.is_active,
        questions=response_questions,
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


@router.post("/", response_model=FlowResponse, status_code=status.HTTP_201_CREATED)
async def create_flow(
    payload: FlowCreateRequest,
    _: User = Depends(require_authority("edit_elements")),
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

    await set_flow_questions(
        flow=flow,
        question_ids=payload.question_ids,
        question_map=question_map,
    )

    if flow.is_active:
        await ensure_only_one_active(flow.id)

    return await to_flow_response(flow)


@router.patch("/{flow_id}", response_model=FlowResponse)
async def update_flow(
    flow_id: int,
    payload: FlowUpdateRequest,
    _: User = Depends(require_authority("edit_elements")),
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

    if payload.is_active is not None:
        flow.is_active = payload.is_active

    if flow.is_active:
        await ensure_only_one_active(flow.id)

    await flow.save()

    if payload.question_ids is not None:
        question_map = await resolve_questions_by_ids(payload.question_ids)
        await set_flow_questions(
            flow=flow,
            question_ids=payload.question_ids,
            question_map=question_map,
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
