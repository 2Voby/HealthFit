from tortoise import fields
from tortoise.models import Model


class Flow(Model):
    id = fields.IntField(pk=True)
    name = fields.CharField(max_length=120, unique=True, index=True)
    is_active = fields.BooleanField(default=False, index=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    flow_questions: fields.ReverseRelation["FlowQuestion"]

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
