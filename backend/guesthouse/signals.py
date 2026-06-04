from decimal import Decimal

from django.db.models import Sum
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from .models import StayPayment, StayBooking


def sync_stay_advance_paid(stay):
    total = stay.payments.filter(status='COMPLETED').aggregate(
        total=Sum('amount')
    )['total'] or Decimal('0')
    stay.advance_paid = total
    stay.sync_payment_status()
    stay.save(update_fields=['advance_paid', 'payment_status'])


@receiver(post_save, sender=StayPayment)
def stay_payment_saved(sender, instance, **kwargs):
    if instance.stay_id:
        sync_stay_advance_paid(instance.stay)


@receiver(post_delete, sender=StayPayment)
def stay_payment_deleted(sender, instance, **kwargs):
    if instance.stay_id:
        try:
            stay = StayBooking.objects.get(pk=instance.stay_id)
            sync_stay_advance_paid(stay)
        except StayBooking.DoesNotExist:
            pass
