from decimal import Decimal

from django.db.models import Sum
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from .models import Payment


def sync_booking_advance_paid(booking):
    total = booking.payments.filter(status='COMPLETED').aggregate(
        total=Sum('amount')
    )['total'] or Decimal('0')
    booking.advance_paid = total
    booking.save(update_fields=['advance_paid', 'remaining_balance', 'payment_status', 'total_price'])


@receiver(post_save, sender=Payment)
def payment_saved(sender, instance, **kwargs):
    if instance.booking_id:
        sync_booking_advance_paid(instance.booking)


@receiver(post_delete, sender=Payment)
def payment_deleted(sender, instance, **kwargs):
    if instance.booking_id:
        sync_booking_advance_paid(instance.booking)
