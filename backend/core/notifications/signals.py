from django.db.models.signals import post_save
from django.dispatch import receiver

from bookings.models import Booking
from finance.models import Payment
from core.notifications.service import dispatch_customer_notification


def _channels_for_user(user):
    ch = []
    if not user or not user.is_authenticated:
        return ch
    from core.models import UserSettings
    settings, _ = UserSettings.objects.get_or_create(user=user)
    if settings.sms_to_customers:
        ch.append('SMS')
    if settings.whatsapp_to_customers:
        ch.append('WHATSAPP')
    return ch


@receiver(post_save, sender=Booking)
def booking_notification(sender, instance, created, **kwargs):
    if not created or instance.booking_status == 'CANCELLED':
        return
    user = instance.created_by
    channels = _channels_for_user(user)
    if not channels:
        return
    customer = instance.customer
    tenant = instance.tenant
    if not tenant or not customer:
        return
    venue = instance.venue.name if instance.venue else 'Hall'
    msg = (
        f'Booking confirmed: {instance.event_name} at {venue} on '
        f'{instance.event_date or "TBD"} ({instance.slot} slot). '
        f'Ref: {instance.booking_id or instance.id}. Gateway Marriage Hall'
    )
    dispatch_customer_notification(
        tenant=tenant,
        booking=instance,
        customer=customer,
        channels=channels,
        message=msg,
        triggered_by=user,
    )


@receiver(post_save, sender=Payment)
def payment_notification(sender, instance, created, **kwargs):
    if not created or instance.status != 'COMPLETED':
        return
    booking = instance.booking
    if not booking:
        return
    user = instance.recorded_by
    channels = _channels_for_user(user)
    if not channels:
        return
    remaining = float(booking.remaining_balance or 0)
    msg = (
        f'Payment received: Rs {float(instance.amount):,.0f} for {booking.event_name}. '
        f'Remaining balance: Rs {remaining:,.0f}. Gateway Marriage Hall'
    )
    dispatch_customer_notification(
        tenant=booking.tenant,
        booking=booking,
        customer=booking.customer,
        channels=channels,
        message=msg,
        triggered_by=user,
    )
