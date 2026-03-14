from datetime import datetime

from pydantic import BaseModel, Field

from src.schemas.question import QuestionResponse


class FlowCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    is_active: bool = False
    question_ids: list[int] = Field(default_factory=list)


class FlowUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    is_active: bool | None = None
    question_ids: list[int] | None = None


class FlowQuestionResponse(BaseModel):
    question_id: int
    position: int
    question: QuestionResponse


class FlowResponse(BaseModel):
    id: int
    name: str
    is_active: bool
    questions: list[FlowQuestionResponse]
    created_at: datetime
    updated_at: datetime


class FlowsListResponse(BaseModel):
    items: list[FlowResponse]
    total: int
