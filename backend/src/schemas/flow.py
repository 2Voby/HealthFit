from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field

from src.schemas.question import QuestionResponse


class FlowTransitionCondition(str, Enum):
    always = "always"
    answer_any = "answer_any"
    answer_all = "answer_all"


class FlowTransitionCreateRequest(BaseModel):
    from_question_id: int
    to_question_id: int | None = None
    condition_type: FlowTransitionCondition = FlowTransitionCondition.answer_any
    answer_ids: list[int] = Field(default_factory=list)
    priority: int = 100


class FlowCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    is_active: bool = False
    question_ids: list[int] = Field(default_factory=list)
    transitions: list[FlowTransitionCreateRequest] = Field(default_factory=list)


class FlowUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    is_active: bool | None = None
    question_ids: list[int] | None = None
    transitions: list[FlowTransitionCreateRequest] | None = None


class FlowQuestionResponse(BaseModel):
    question_id: int
    position: int
    question: QuestionResponse


class FlowTransitionResponse(BaseModel):
    id: int
    from_question_id: int
    to_question_id: int | None
    condition_type: FlowTransitionCondition
    answer_ids: list[int]
    priority: int
    created_at: datetime
    updated_at: datetime


class FlowResolveNextRequest(BaseModel):
    current_question_id: int
    selected_answer_ids: list[int] = Field(default_factory=list)


class FlowResolveNextResponse(BaseModel):
    flow_id: int
    current_question_id: int
    selected_answer_ids: list[int]
    matched_transition_id: int | None
    next_question_id: int | None
    is_finished: bool
    next_question: QuestionResponse | None


class FlowResponse(BaseModel):
    id: int
    name: str
    is_active: bool
    start_question_id: int | None
    questions: list[FlowQuestionResponse]
    transitions: list[FlowTransitionResponse]
    created_at: datetime
    updated_at: datetime


class FlowsListResponse(BaseModel):
    items: list[FlowResponse]
    total: int
