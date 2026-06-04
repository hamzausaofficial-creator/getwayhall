from decimal import Decimal
from datetime import date, timedelta

from django.test import TestCase
from rest_framework.test import APIClient

from authentication.models import User
from bookings.models import Booking
from core.models import Tenant
from customers.models import Customer
from finance.models import Payment
from venues.models import Venue


class BookingTenantAndOverlapTests(TestCase):
    def setUp(self):
        self.tenant_a = Tenant.objects.create(name='Hall A', subdomain='halla')
        self.tenant_b = Tenant.objects.create(name='Hall B', subdomain='hallb')
        self.admin_a = User.objects.create_user(
            username='admin_a',
            email='admin_a@test.com',
            password='pass12345',
            role='ADMIN',
            tenant=self.tenant_a,
        )
        self.admin_b = User.objects.create_user(
            username='admin_b',
            email='admin_b@test.com',
            password='pass12345',
            role='ADMIN',
            tenant=self.tenant_b,
        )
        self.customer_a = Customer.objects.create(
            tenant=self.tenant_a, full_name='Client A', phone='03001234567'
        )
        self.venue_a = Venue.objects.create(
            tenant=self.tenant_a, name='Main', location='Floor 1', capacity=500, price_per_day=100000
        )
        self.event_date = date.today() + timedelta(days=30)
        Booking.objects.create(
            tenant=self.tenant_a,
            customer=self.customer_a,
            venue=self.venue_a,
            event_name='Existing',
            event_date=self.event_date,
            slot='evening',
            gents_count=100,
            ladies_count=100,
            rate_per_head=Decimal('1000'),
            booking_status='CONFIRMED',
        )

    def test_tenant_user_cannot_see_other_tenant_bookings(self):
        client = APIClient()
        client.force_authenticate(user=self.admin_b)
        response = client.get('/api/bookings/')
        self.assertEqual(response.status_code, 200)
        payload = response.data
        items = payload.get('results', payload) if isinstance(payload, dict) else payload
        self.assertEqual(len(items), 0)

    def test_overlap_same_venue_slot_rejected(self):
        client = APIClient()
        client.force_authenticate(user=self.admin_a)
        payload = {
            'customer': self.customer_a.id,
            'venue': self.venue_a.id,
            'event_name': 'Conflict',
            'event_date': self.event_date.isoformat(),
            'slot': 'evening',
            'gents_count': 50,
            'ladies_count': 50,
            'rate_per_head': '1000',
            'booking_status': 'CONFIRMED',
        }
        response = client.post('/api/bookings/', payload, format='json')
        self.assertEqual(response.status_code, 400)
