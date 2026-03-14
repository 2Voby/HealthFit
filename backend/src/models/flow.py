from enum import Enum

from tortoise import fields
from tortoise.models import Model


class Flow(Model):
    id = fields.IntField(pk=True)
    name = fields.CharField(max_length=120, unique=True, index=True)
    is_active = fields.BooleanField(default=False, index=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    flow_questions: fields.ReverseRelation["FlowQuestion"]
    transitions: fields.ReverseRelation["FlowTransition"]

    class Meta:
        table = "app_flows"


class FlowQuestion(Model):
    id = fields.IntField(pk=True)
    flow = fields.ForeignKeyField(
        "models.Flow",
        related_name="flow_questions",
        on_delete=fields.CASCADE,
    )
    question = fields.ForeignKeyField(
        "models.Question",
        related_name="question_flows",
        on_delete=fields.CASCADE,
    )
    position = fields.IntField()
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "app_flow_questions"
        unique_together = (("flow", "question"), ("flow", "position"))


class FlowTransitionCondition(str, Enum):
    always = "always"
    answer_any = "answer_any"
    answer_all = "answer_all"


class FlowTransition(Model):
    id = fields.IntField(pk=True)
    flow = fields.ForeignKeyField(
        "models.Flow",
        related_name="transitions",
        on_delete=fields.CASCADE,
    )
    from_question = fields.ForeignKeyField(
        "models.Question",
        related_name="outgoing_transitions",
        on_delete=fields.CASCADE,
    )
    to_question = fields.ForeignKeyField(
        "models.Question",
        related_name="incoming_transitions",
        null=True,
        on_delete=fields.SET_NULL,
    )
    condition_type = fields.CharEnumField(FlowTransitionCondition, max_length=32)
    priority = fields.IntField(default=100)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "app_flow_transitions"


class FlowTransitionAnswer(Model):
    id = fields.IntField(pk=True)
    transition = fields.ForeignKeyField(
        "models.FlowTransition",
        related_name="transition_answers",
        on_delete=fields.CASCADE,
    )
    answer = fields.ForeignKeyField(
        "models.QuestionAnswer",
        related_name="answer_transitions",
        on_delete=fields.CASCADE,
    )
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "app_flow_transition_answers"
        unique_together = (("transition", "answer"),)


class FlowHistoryAction(str, Enum):
    create = "create"
    update = "update"
    rollback = "rollback"
    dependency_update = "dependency_update"


class FlowHistory(Model):
    id = fields.IntField(pk=True)
    flow = fields.ForeignKeyField(
        "models.Flow",
        related_name="history",
        on_delete=fields.CASCADE,
    )
    revision = fields.IntField()
    action = fields.CharEnumField(FlowHistoryAction, max_length=32)
    snapshot = fields.JSONField()
    source_revision = fields.IntField(null=True)
    changed_by_user = fields.ForeignKeyField(
        "models.User",
        related_name="flow_changes",
        null=True,
        on_delete=fields.SET_NULL,
    )
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "app_flow_history"
        unique_together = (("flow", "revision"),)
