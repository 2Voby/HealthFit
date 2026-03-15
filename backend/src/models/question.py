from enum import Enum

from tortoise import fields
from tortoise.models import Model


class QuestionType(str, Enum):
    singe_choise = "singe_choise"
    multiple_choise = "multiple_choise"
    manual_input = "manual_input"
    text = "text"


class ManualInputType(str, Enum):
    number = "number"


class Question(Model):
    id = fields.IntField(pk=True)
    text = fields.TextField()
    type = fields.CharEnumField(QuestionType, max_length=32)
    manual_input_type = fields.CharEnumField(ManualInputType, max_length=32, null=True)
    manual_input_min = fields.IntField(null=True)
    manual_input_max = fields.IntField(null=True)
    requires = fields.BooleanField(default=False)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    answers: fields.ReverseRelation["QuestionAnswer"]

    class Meta:
        table = "questions"


class QuestionAnswer(Model):
    id = fields.IntField(pk=True)
    question = fields.ForeignKeyField(
        "models.Question",
        related_name="answers",
        on_delete=fields.CASCADE,
    )
    text = fields.TextField()
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    attributes = fields.ManyToManyField(
        "models.Attribute",
        related_name="question_answers",
        through="question_answers_attributes",
    )

    class Meta:
        table = "question_answers"
