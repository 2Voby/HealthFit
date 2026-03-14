from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field

from src.schemas.question import QuestionResponse


class FlowSessionStatus(str, Enum):
    in_progress = "in_progress"
    completed = "completed"


class FlowSessionAttributeSource(str, Enum):
    answer = "answer"
    manual_input = "manual_input"


class FlowSessionCreateRequest(BaseModel):
    context: dict[str, Any] = Field(default_factory=dict)


class FlowSessionNextRequest(BaseModel):
    selected_answer_ids: list[int] = Field(default_factory=list)
    manual_input: str | None = None
    derived_attribute_ids: list[int] = Field(default_factory=list)
    context_patch: dict[str, Any] = Field(default_factory=dict)


class FlowSessionAnswerResponse(BaseModel):
    question_id: int
    selected_answer_ids: list[int]
    manual_input: str | None
    created_at: datetime
    updated_at: datetime


class FlowSessionDerivedAttributeResponse(BaseModel):
    attribute_id: int
    source: FlowSessionAttributeSource
    question_id: int | None
    session_answer_id: int | None
    created_at: datetime
    updated_at: datetime


class FlowSessionResponse(BaseModel):
    id: str
    flow_id: int
    status: FlowSessionStatus
    current_question_id: int | None
    current_question: QuestionResponse | None
    context: dict[str, Any]
    answers: list[FlowSessionAnswerResponse]
    derived_attributes: list[FlowSessionDerivedAttributeResponse]
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None


class FlowSessionAdvanceResponse(BaseModel):
    flow_id: int
    session_id: str
    previous_question_id: int
    matched_transition_id: int | None
    next_question_id: int | None
    is_finished: bool
    next_question: QuestionResponse | None
    session: FlowSessionResponse
