from tortoise import fields
from tortoise.models import Model


class User(Model):
    id = fields.IntField(pk=True)
    login = fields.CharField(max_length=100, unique=True, index=True)
    password_hash = fields.CharField(max_length=255)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    authorities = fields.ManyToManyField(
        "models.Authority",
        related_name="users",
        through="users_authorities",
    )

    class Meta:
        table = "users"
