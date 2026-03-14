from enum import Enum

from tortoise import fields
from tortoise.models import Model


class FlowSessionStatus(str, Enum):
    in_progress = "in_progress"
    completed = "completed"


class FlowSessionAttributeSource(str, Enum):
    answer = "answer"
    manual_input = "manual_input"


class FlowSession(Model):
    id = fields.IntField(pk=True)
    public_id = fields.CharField(max_length=64, unique=True, index=True)
    flow = fields.ForeignKeyField(
        "models.Flow",
        related_name="sessions",
        on_delete=fields.CASCADE,
    )
    user = fields.ForeignKeyField(
        "models.User",
        related_name="flow_sessions",
        null=True,
        on_delete=fields.SET_NULL,
    )
    status = fields.CharEnumField(FlowSessionStatus, max_length=32, default=FlowSessionStatus.in_progress, index=True)
    current_question = fields.ForeignKeyField(
        "models.Question",
        related_name="active_in_sessions",
        null=True,
        on_delete=fields.SET_NULL,
    )
    context = fields.JSONField(default=dict)
    completed_at = fields.DatetimeField(null=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    answers: fields.ReverseRelation["FlowSessionAnswer"]
    derived_attributes: fields.ReverseRelation["FlowSessionAttribute"]

    class Meta:
        table = "app_flow_sessions"


class FlowSessionAnswer(Model):
    id = fields.IntField(pk=True)
    session = fields.ForeignKeyField(
        "models.FlowSession",
        related_name="answers",
        on_delete=fields.CASCADE,
    )
    question = fields.ForeignKeyField(
        "models.Question",
        related_name="session_answers",
        on_delete=fields.CASCADE,
    )
    manual_input = fields.TextField(null=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    selected_answers: fields.ReverseRelation["FlowSessionAnswerSelection"]

    class Meta:
        table = "app_flow_session_answers"
        unique_together = (("session", "question"),)


class FlowSessionAnswerSelection(Model):
    id = fields.IntField(pk=True)
    session_answer = fields.ForeignKeyField(
        "models.FlowSessionAnswer",
        related_name="selected_answers",
        on_delete=fields.CASCADE,
    )
    answer = fields.ForeignKeyField(
        "models.QuestionAnswer",
        related_name="selected_in_flow_sessions",
        on_delete=fields.CASCADE,
    )
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "app_flow_session_answer_selections"
        unique_together = (("session_answer", "answer"),)


class FlowSessionAttribute(Model):
    id = fields.IntField(pk=True)
    session = fields.ForeignKeyField(
        "models.FlowSession",
        related_name="derived_attributes",
        on_delete=fields.CASCADE,
    )
    attribute = fields.ForeignKeyField(
        "models.Attribute",
        related_name="flow_session_attributes",
        on_delete=fields.CASCADE,
    )
    source = fields.CharEnumField(FlowSessionAttributeSource, max_length=32, default=FlowSessionAttributeSource.answer)
    question = fields.ForeignKeyField(
        "models.Question",
        related_name="flow_session_attributes",
        null=True,
        on_delete=fields.SET_NULL,
    )
    session_answer = fields.ForeignKeyField(
        "models.FlowSessionAnswer",
        related_name="derived_attributes",
        null=True,
        on_delete=fields.SET_NULL,
    )
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "app_flow_session_attributes"
        unique_together = (("session", "attribute"),)
