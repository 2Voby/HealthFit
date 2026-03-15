from datetime import datetime
from enum import Enum

from pydantic import AliasChoices, BaseModel, Field, model_validator


class QuestionType(str, Enum):
    singe_choise = "singe_choise"
    multiple_choise = "multiple_choise"
    manual_input = "manual_input"
    text = "text"


class ManualInputType(str, Enum):
    number = "number"


DEFAULT_MANUAL_INPUT_MIN = 0
DEFAULT_MANUAL_INPUT_MAX = 999


class ManualInputConfig(BaseModel):
    type: ManualInputType = ManualInputType.number
    min: int = DEFAULT_MANUAL_INPUT_MIN
    max: int = DEFAULT_MANUAL_INPUT_MAX

    @model_validator(mode="after")
    def validate_range(self) -> "ManualInputConfig":
        if self.min > self.max:
            raise ValueError("manual_input.min must be less than or equal to manual_input.max")
        return self


def default_manual_input_config() -> ManualInputConfig:
    return ManualInputConfig(
        type=ManualInputType.number,
        min=DEFAULT_MANUAL_INPUT_MIN,
        max=DEFAULT_MANUAL_INPUT_MAX,
    )


def build_manual_input_config(
    *,
    input_type: ManualInputType | str | None,
    min_value: int | None,
    max_value: int | None,
) -> ManualInputConfig | None:
    if input_type is None and min_value is None and max_value is None:
        return None

    resolved_type = ManualInputType(input_type) if input_type is not None else ManualInputType.number
    return ManualInputConfig(
        type=resolved_type,
        min=DEFAULT_MANUAL_INPUT_MIN if min_value is None else min_value,
        max=DEFAULT_MANUAL_INPUT_MAX if max_value is None else max_value,
    )


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
    manual_input: ManualInputConfig | None = None
    requires: bool = False
    answers: list[QuestionAnswerCreateRequest] = Field(default_factory=list)


class QuestionUpdateRequest(BaseModel):
    text: str | None = Field(default=None, min_length=1)
    type: QuestionType | None = None
    manual_input: ManualInputConfig | None = None
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
    manual_input: ManualInputConfig | None
    requires: bool
    answers: list[QuestionAnswerResponse]
    created_at: datetime
    updated_at: datetime


class QuestionsListResponse(BaseModel):
    items: list[QuestionResponse]
    total: int
