from django.test import TestCase

from authentication.models import User
from core.models import NotificationLog, Tenant
from core.notifications.service import dispatch_customer_notification


class NotificationSkipTests(TestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(name='Notify Hall', subdomain='notify')

    def test_skips_when_customer_has_no_phone(self):
        from customers.models import Customer

        customer = Customer.objects.create(
            tenant=self.tenant, full_name='No Phone', phone=''
        )
        logs = dispatch_customer_notification(
            tenant=self.tenant,
            customer=customer,
            channels=['SMS'],
            message='Test',
        )
        self.assertEqual(len(logs), 1)
        self.assertEqual(logs[0].status, 'SKIPPED')
        self.assertEqual(NotificationLog.objects.count(), 1)
