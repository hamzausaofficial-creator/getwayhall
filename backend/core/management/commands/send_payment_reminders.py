from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from bookings.models import Booking
from core.models import Tenant, UserSettings
from core.notifications.service import dispatch_customer_notification


class Command(BaseCommand):
    help = 'Send payment due SMS/WhatsApp reminders for upcoming events'

    def add_arguments(self, parser):
        parser.add_argument('--days', type=int, default=7, help='Look ahead N days')

    def handle(self, *args, **options):
        days = options['days']
        today = timezone.localdate()
        until = today + timedelta(days=days)
        sent = 0

        for tenant in Tenant.objects.filter(is_active=True, sms_enabled=True):
            admin = tenant.users.filter(role='ADMIN').first()
            settings = UserSettings.objects.filter(user=admin).first() if admin else None
            if not settings or (not settings.sms_to_customers and not settings.whatsapp_to_customers):
                continue
            channels = []
            if settings.sms_to_customers:
                channels.append('SMS')
            if settings.whatsapp_to_customers:
                channels.append('WHATSAPP')

            bookings = Booking.objects.filter(
                tenant=tenant,
                event_date__gte=today,
                event_date__lte=until,
                remaining_balance__gt=0,
                booking_status__in=['PENDING', 'CONFIRMED', 'COMPLETED'],
            ).select_related('customer', 'venue')

            for booking in bookings:
                msg = (
                    f'Payment reminder: Rs {float(booking.remaining_balance):,.0f} due for '
                    f'{booking.event_name} on {booking.event_date}. Gateway Marriage Hall'
                )
                logs = dispatch_customer_notification(
                    tenant=tenant,
                    booking=booking,
                    customer=booking.customer,
                    channels=channels,
                    message=msg,
                    triggered_by=admin,
                )
                sent += len(logs)

        self.stdout.write(self.style.SUCCESS(f'Processed reminders; {sent} notification log entries.'))
