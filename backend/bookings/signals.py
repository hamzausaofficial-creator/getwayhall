from django.db.models.signals import post_save
from django.dispatch import receiver

from core.models import Tenant
from .page_visibility import ensure_tenant_hall_pages


@receiver(post_save, sender=Tenant)
def seed_tenant_hall_pages(sender, instance, **kwargs):
    ensure_tenant_hall_pages(instance)
