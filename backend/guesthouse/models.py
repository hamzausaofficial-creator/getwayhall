from django.db import models
from django.conf import settings
from core.models import Tenant
from customers.models import Customer
import datetime
import random
from decimal import Decimal

from .billing import get_included_guests, compute_room_charges


class Room(models.Model):
    TYPE_CHOICES = (
        ('SINGLE', 'Single'),
        ('DOUBLE', 'Double'),
        ('SUITE', 'Suite'),
        ('FAMILY', 'Family'),
    )
    STATUS_CHOICES = (
        ('ACTIVE', 'Active'),
        ('MAINTENANCE', 'Maintenance'),
        ('INACTIVE', 'Inactive'),
    )

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='gh_rooms')
    room_number = models.CharField(max_length=20)
    room_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='DOUBLE')
    beds = models.PositiveIntegerField(default=1)
    included_guests = models.PositiveIntegerField(
        default=0,
        help_text='Guests included in base rate. 0 = use bed count.',
    )
    extra_guest_fee_per_night = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text='Extra charge per additional guest per night.',
    )
    price_per_night = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField(blank=True, default='')
    image = models.ImageField(upload_to='gh_rooms/', blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [('tenant', 'room_number')]
        ordering = ['room_number']

    def __str__(self):
        return f'{self.room_number} ({self.get_room_type_display()})'

    def get_included_guests(self):
        return get_included_guests(self)


class GuestHouseService(models.Model):
    PRICING_UNITS = (
        ('PER_NIGHT', 'Per night'),
        ('PER_STAY', 'Per stay'),
        ('PER_GUEST', 'Per guest per night'),
    )

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='gh_services')
    code = models.CharField(max_length=32)
    label = models.CharField(max_length=120)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    pricing_unit = models.CharField(max_length=20, choices=PRICING_UNITS, default='PER_NIGHT')
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['sort_order', 'label']
        unique_together = [('tenant', 'code')]

    def __str__(self):
        return self.label


class StayBooking(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('CONFIRMED', 'Confirmed'),
        ('CHECKED_IN', 'Checked In'),
        ('CHECKED_OUT', 'Checked Out'),
        ('CANCELLED', 'Cancelled'),
    )
    PAYMENT_STATUS_CHOICES = (
        ('UNPAID', 'Unpaid'),
        ('PARTIAL', 'Partial'),
        ('PAID', 'Paid'),
    )

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='gh_stays')
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='gh_stays')
    room = models.ForeignKey(Room, on_delete=models.PROTECT, related_name='stays')
    booking_ref = models.CharField(max_length=50, blank=True, unique=True, null=True)
    check_in = models.DateField()
    check_out = models.DateField()
    guests_count = models.PositiveIntegerField(default=1)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    advance_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='UNPAID')
    notes = models.TextField(blank=True, default='')
    cancellation_reason = models.TextField(blank=True, default='')
    cancelled_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='gh_stays_created',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-check_in']

    def __str__(self):
        return self.booking_ref or f'Stay #{self.pk}'

    @property
    def nights(self):
        if not self.check_in or not self.check_out:
            return 0
        return max((self.check_out - self.check_in).days, 1)

    @property
    def remaining_balance(self):
        if self.status == 'CANCELLED':
            return Decimal('0')
        return max(Decimal(str(self.total_amount)) - Decimal(str(self.advance_paid)), Decimal('0'))

    def recalculate_total(self):
        if not (self.room_id and self.check_in and self.check_out):
            return
        room = self.room
        nights = max((self.check_out - self.check_in).days, 1)
        room_charges = compute_room_charges(room, nights, self.guests_count)
        room_guest_total = room_charges['room_total']

        charges_total = Decimal('0')
        if self.pk:
            charges_total = self.charges.aggregate(t=models.Sum('amount'))['t'] or Decimal('0')

        self.total_amount = room_guest_total + charges_total

    def sync_payment_status(self):
        total = Decimal(str(self.total_amount))
        paid = Decimal(str(self.advance_paid))
        if paid <= 0:
            self.payment_status = 'UNPAID'
        elif paid >= total:
            self.payment_status = 'PAID'
        else:
            self.payment_status = 'PARTIAL'

    def save(self, *args, **kwargs):
        if not self.booking_ref:
            prefix = 'GH'
            date_part = datetime.date.today().strftime('%y%m%d')
            rand_part = str(random.randint(1000, 9999))
            self.booking_ref = f'{prefix}{date_part}{rand_part}'
        if self.room_id and self.check_in and self.check_out:
            self.recalculate_total()
        self.sync_payment_status()
        super().save(*args, **kwargs)


class StayCharge(models.Model):
    CHARGE_TYPES = (
        ('SERVICE', 'Add-on service'),
        ('CUSTOM', 'Custom charge'),
    )

    stay = models.ForeignKey(StayBooking, on_delete=models.CASCADE, related_name='charges')
    service = models.ForeignKey(
        GuestHouseService,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='stay_charges',
    )
    charge_type = models.CharField(max_length=20, choices=CHARGE_TYPES, default='SERVICE')
    description = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f'{self.description} - {self.amount}'


class StayGuest(models.Model):
    """Guest on a stay — primary booker plus companions (Booking.com-style roster)."""
    stay = models.ForeignKey(StayBooking, on_delete=models.CASCADE, related_name='guest_roster')
    customer = models.ForeignKey(
        Customer,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='stay_guest_entries',
    )
    full_name = models.CharField(max_length=200)
    cnic = models.CharField(max_length=20, blank=True, default='')
    phone = models.CharField(max_length=20, blank=True, default='')
    is_primary = models.BooleanField(default=False)
    sort_order = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['sort_order', 'id']

    def __str__(self):
        role = 'Primary' if self.is_primary else 'Guest'
        return f'{self.full_name} ({role})'


class StayPayment(models.Model):
    METHOD_CHOICES = (
        ('CASH', 'Cash'),
        ('CARD', 'Credit/Debit Card'),
        ('BANK_TRANSFER', 'Bank Transfer'),
        ('ONLINE', 'Online Payment'),
    )
    STATUS_CHOICES = (
        ('COMPLETED', 'Completed'),
        ('PENDING', 'Pending'),
        ('FAILED', 'Failed'),
    )

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='gh_payments')
    stay = models.ForeignKey(StayBooking, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=METHOD_CHOICES, default='CASH')
    transaction_id = models.CharField(max_length=100, blank=True, default='')
    payment_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='COMPLETED')
    notes = models.TextField(blank=True, default='')
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='gh_payments_recorded',
    )

    class Meta:
        ordering = ['-payment_date']

    def __str__(self):
        return f'GH-PAY-{self.id}'


class GhExpense(models.Model):
    CATEGORY_CHOICES = (
        ('SALARY', 'Salary'),
        ('UTILITIES', 'Utilities'),
        ('MAINTENANCE', 'Maintenance'),
        ('SUPPLIES', 'Supplies'),
        ('LAUNDRY', 'Laundry'),
        ('MARKETING', 'Marketing'),
        ('OTHER', 'Other'),
    )

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='gh_expenses')
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='OTHER')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    expense_date = models.DateField()
    description = models.TextField(blank=True, default='')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='gh_expenses_created',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-expense_date', '-id']

    def __str__(self):
        return self.title


class GuestHousePageVisibility(models.Model):
    """Per-tenant toggle for Guest House sidebar pages (managed in Django admin)."""

    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='gh_page_visibility',
    )
    page_key = models.CharField(max_length=32)
    label = models.CharField(max_length=64)
    is_visible = models.BooleanField(
        default=True,
        help_text='Uncheck to hide this page or in-app module from the Guest House app.',
    )
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['sort_order', 'page_key']
        unique_together = [('tenant', 'page_key')]
        verbose_name = 'GH page / module hide/show'
        verbose_name_plural = 'GH pages & modules hide/show'

    def __str__(self):
        status = 'Visible' if self.is_visible else 'Hidden'
        return f'{self.label} ({self.tenant.name}) - {status}'
