from tortoise import fields
from tortoise.models import Model


class Authority(Model):
    id = fields.IntField(pk=True)
    name = fields.CharField(max_length=100, unique=True)

    users: fields.ManyToManyRelation["User"]

    class Meta:
        table = "authorities"
