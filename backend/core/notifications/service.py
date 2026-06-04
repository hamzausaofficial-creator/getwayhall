import re
from django.utils import timezone

from core.models import NotificationLog, UserSettings


def _normalize_phone(phone, country_code='+92'):
    if not phone:
        return ''
    digits = re.sub(r'\D', '', str(phone))
    if not digits:
        return ''
    if digits.startswith('92'):
        return f'+{digits}'
    if digits.startswith('0'):
        return f'{country_code}{digits[1:]}'
    if len(digits) == 10:
        return f'{country_code}{digits}'
    return f'+{digits}' if not str(phone).startswith('+') else str(phone)


def _user_wants_channel(user, channel):
    if not user or not user.is_authenticated:
        return False
    settings, _ = UserSettings.objects.get_or_create(user=user)
    if channel == 'SMS':
        return settings.sms_to_customers
    if channel == 'WHATSAPP':
        return settings.whatsapp_to_customers
    return False


def dispatch_customer_notification(
    *,
    tenant,
    booking=None,
    customer=None,
    channels,
    message,
    triggered_by=None,
):
    """
    Send SMS/WhatsApp to customer when enabled. Skips if no phone (logs SKIPPED).
    """
    results = []
    if not customer or not tenant:
        return results

    phone_raw = getattr(customer, 'phone', '') or ''
    phone = _normalize_phone(phone_raw, getattr(tenant, 'default_country_code', '+92'))

    if not getattr(tenant, 'sms_enabled', True):
        for ch in channels:
            log = NotificationLog.objects.create(
                tenant=tenant,
                booking=booking,
                customer=customer,
                notification_type=ch,
                status='SKIPPED',
                recipient=phone_raw or '—',
                message=message,
                error_message='SMS disabled for venue',
            )
            results.append(log)
        return results

    if not phone:
        for ch in channels:
            log = NotificationLog.objects.create(
                tenant=tenant,
                booking=booking,
                customer=customer,
                notification_type=ch,
                status='SKIPPED',
                recipient='—',
                message=message,
                error_message='No customer phone on file',
            )
            results.append(log)
        return results

    from .providers import get_provider
    provider = get_provider()

    for ch in channels:
        if triggered_by and not _user_wants_channel(triggered_by, ch):
            NotificationLog.objects.create(
                tenant=tenant,
                booking=booking,
                customer=customer,
                notification_type=ch,
                status='SKIPPED',
                recipient=phone,
                message=message,
                error_message='Channel disabled in user settings',
            )
            continue

        log = NotificationLog.objects.create(
            tenant=tenant,
            booking=booking,
            customer=customer,
            notification_type=ch,
            status='PENDING',
            recipient=phone,
            message=message,
        )
        if ch == 'SMS':
            ok, err = provider.send_sms(phone, message)
        elif ch == 'WHATSAPP':
            ok, err = provider.send_whatsapp(phone, message)
        else:
            ok, err = False, 'Unsupported channel'

        log.status = 'SENT' if ok else 'FAILED'
        log.error_message = err or ''
        if ok:
            log.sent_at = timezone.now()
        log.save(update_fields=['status', 'error_message', 'sent_at'])
        results.append(log)

    return results
