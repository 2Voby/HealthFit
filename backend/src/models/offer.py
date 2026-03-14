from tortoise import fields
from tortoise.models import Model


class Offer(Model):
    id = fields.IntField(pk=True)
    name = fields.CharField(max_length=120, unique=True, index=True)
    description = fields.TextField()
    price = fields.FloatField()
    priority = fields.IntField(default=0)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    requires_all = fields.ManyToManyField(
        "models.Attribute",
        related_name="required_all_offers",
        through="offers_requires_all_attributes",
    )
    requires_optional = fields.ManyToManyField(
        "models.Attribute",
        related_name="required_optional_offers",
        through="offers_requires_optional_attributes",
    )
    excludes = fields.ManyToManyField(
        "models.Attribute",
        related_name="excluding_offers",
        through="offers_excludes_attributes",
    )

    class Meta:
        table = "offers"
