from tortoise import fields
from tortoise.models import Model


class Attribute(Model):
    id = fields.IntField(pk=True)
    name = fields.CharField(max_length=120, unique=True, index=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "attributes"
