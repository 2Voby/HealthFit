from tortoise import fields
from tortoise.models import Model


class Offer(Model):
    id = fields.IntField(pk=True)
    name = fields.CharField(max_length=120, unique=True, index=True)
    description = fields.TextField()
    wellness_kit_name = fields.CharField(max_length=180, default="")
    wellness_kit_image_url = fields.CharField(max_length=1000, default="")
    wellness_kit_description = fields.TextField(default="")
    price = fields.FloatField()
    is_default = fields.BooleanField(default=False, index=True)
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
