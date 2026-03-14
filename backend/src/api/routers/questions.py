from fastapi import APIRouter, Depends, HTTPException, Query, status

from src.api.deps import require_authority
from src.core.flow_history import create_flow_history_for_all_flows
from src.models import Attribute, Question, QuestionAnswer, User
from src.schemas.question import (
    QuestionAnswerCreateRequest,
    QuestionAnswerResponse,
    QuestionCreateRequest,
    QuestionResponse,
    QuestionsListResponse,
    QuestionType,
    QuestionUpdateRequest,
)

router = APIRouter(prefix="/questions", tags=["questions"])


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


def question_type_value(question_type: object) -> str:
    if hasattr(question_type, "value"):
        return str(getattr(question_type, "value"))
    return str(question_type)


def validate_answers(question_type: object, answers: list[QuestionAnswerCreateRequest]) -> None:
    question_type_value_str = question_type_value(question_type)
    if question_type_value_str in {QuestionType.manual_input.value, QuestionType.text.value} and answers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{question_type_value_str} question must not contain predefined answers",
        )


async def replace_question_answers(
    question: Question,
    answers_payload: list[QuestionAnswerCreateRequest],
) -> None:
    await QuestionAnswer.filter(question=question).delete()
    for answer_payload in answers_payload:
        answer = await QuestionAnswer.create(
            question=question,
            text=answer_payload.text,
        )
        attributes = await resolve_attributes(answer_payload.attributes)
        if attributes:
            await answer.attributes.add(*attributes)


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


@router.get("/", response_model=QuestionsListResponse)
async def list_questions(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
) -> QuestionsListResponse:
    total = await Question.all().count()
    questions = await Question.all().order_by("id").offset(offset).limit(limit)
    return QuestionsListResponse(
        items=[await to_question_response(question) for question in questions],
        total=total,
    )


@router.get("/{question_id}", response_model=QuestionResponse)
async def get_question(
    question_id: int,
) -> QuestionResponse:
    question = await Question.get_or_none(id=question_id)
    if question is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
    return await to_question_response(question)


@router.post("/", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
async def create_question(
    payload: QuestionCreateRequest,
    current_user: User = Depends(require_authority("edit_elements")),
) -> QuestionResponse:
    validate_answers(payload.type, payload.answers)
    if payload.type == QuestionType.text and payload.requires:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="text question must have requires=false",
        )

    question = await Question.create(
        text=payload.text,
        type=payload.type.value,
        requires=payload.requires,
    )
    await replace_question_answers(question, payload.answers)
    await create_flow_history_for_all_flows(changed_by_user=current_user)

    return await to_question_response(question)


@router.patch("/{question_id}", response_model=QuestionResponse)
async def update_question(
    question_id: int,
    payload: QuestionUpdateRequest,
    current_user: User = Depends(require_authority("edit_elements")),
) -> QuestionResponse:
    question = await Question.get_or_none(id=question_id)
    if question is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    effective_type = payload.type.value if payload.type is not None else question_type_value(question.type)
    effective_requires = payload.requires if payload.requires is not None else question.requires
    should_replace_answers = payload.answers is not None
    answers_to_save = payload.answers if payload.answers is not None else []

    if effective_type == QuestionType.text.value and effective_requires:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="text question must have requires=false",
        )

    if effective_type in {QuestionType.manual_input.value, QuestionType.text.value}:
        should_replace_answers = True
        answers_to_save = payload.answers if payload.answers is not None else []
        validate_answers(effective_type, answers_to_save)

    if payload.text is not None:
        question.text = payload.text
    if payload.type is not None:
        question.type = payload.type.value
    if payload.requires is not None:
        question.requires = payload.requires

    await question.save()

    if should_replace_answers:
        await replace_question_answers(question, answers_to_save)

    await create_flow_history_for_all_flows(changed_by_user=current_user)
    return await to_question_response(question)


@router.delete("/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_question(
    question_id: int,
    current_user: User = Depends(require_authority("edit_elements")),
) -> None:
    question = await Question.get_or_none(id=question_id)
    if question is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
    await question.delete()
    await create_flow_history_for_all_flows(changed_by_user=current_user)
