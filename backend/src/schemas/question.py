from datetime import datetime
from enum import Enum

from pydantic import AliasChoices, BaseModel, Field


class QuestionType(str, Enum):
    singe_choise = "singe_choise"
    multiple_choise = "multiple_choise"
    manual_input = "manual_input"
    text = "text"


class QuestionAnswerCreateRequest(BaseModel):
    text: str = Field(min_length=1)
    attributes: list[int] = Field(
        default_factory=list,
        validation_alias=AliasChoices("attributes", "atributes"),
        serialization_alias="attributes",
    )


class QuestionCreateRequest(BaseModel):
    text: str = Field(min_length=1)
    type: QuestionType
    requires: bool = False
    answers: list[QuestionAnswerCreateRequest] = Field(default_factory=list)


class QuestionUpdateRequest(BaseModel):
    text: str | None = Field(default=None, min_length=1)
    type: QuestionType | None = None
    requires: bool | None = None
    answers: list[QuestionAnswerCreateRequest] | None = None


class QuestionAnswerResponse(BaseModel):
    id: int
    text: str
    attributes: list[int]
    created_at: datetime
    updated_at: datetime


class QuestionResponse(BaseModel):
    id: int
    text: str
    type: QuestionType
    requires: bool
    answers: list[QuestionAnswerResponse]
    created_at: datetime
    updated_at: datetime


class QuestionsListResponse(BaseModel):
    items: list[QuestionResponse]
    total: int
