import logging
import os

logger = logging.getLogger(__name__)


class ConsoleProvider:
    def send_sms(self, recipient, message):
        logger.info('SMS [%s]: %s', recipient, message[:120])
        return True, None

    def send_whatsapp(self, recipient, message):
        logger.info('WhatsApp [%s]: %s', recipient, message[:120])
        return True, None


class TwilioProvider:
    def __init__(self):
        from twilio.rest import Client
        self.client = Client(
            os.environ.get('TWILIO_ACCOUNT_SID'),
            os.environ.get('TWILIO_AUTH_TOKEN'),
        )
        self.sms_from = os.environ.get('TWILIO_FROM_NUMBER', '')
        self.whatsapp_from = os.environ.get('TWILIO_WHATSAPP_FROM', '')

    def send_sms(self, recipient, message):
        try:
            self.client.messages.create(body=message, from_=self.sms_from, to=recipient)
            return True, None
        except Exception as exc:
            return False, str(exc)

    def send_whatsapp(self, recipient, message):
        try:
            to = recipient if recipient.startswith('whatsapp:') else f'whatsapp:{recipient}'
            frm = self.whatsapp_from if self.whatsapp_from.startswith('whatsapp:') else f'whatsapp:{self.whatsapp_from}'
            self.client.messages.create(body=message, from_=frm, to=to)
            return True, None
        except Exception as exc:
            return False, str(exc)


def get_provider():
    backend = os.environ.get('NOTIFICATION_BACKEND', 'console').lower()
    if backend == 'twilio':
        try:
            return TwilioProvider()
        except Exception as exc:
            logger.warning('Twilio unavailable: %s', exc)
    return ConsoleProvider()
