from django.contrib import admin

from core.admin_mixins import TenantScopedAdminMixin

from .models import Booking


@admin.register(Booking)
class BookingAdmin(TenantScopedAdminMixin, admin.ModelAdmin):
    list_display = (
        'booking_id', 'event_name', 'customer', 'venue', 'event_date',
        'slot', 'booking_status', 'payment_status', 'total_price', 'advance_paid', 'tenant',
    )
    list_filter = ('booking_status', 'payment_status', 'slot', 'tenant', 'event_date')
    search_fields = (
        'booking_id', 'event_name', 'customer__full_name',
        'customer__first_name', 'customer__last_name', 'customer__phone',
    )
    readonly_fields = ('created_at', 'booking_id')
    raw_id_fields = ('customer', 'venue', 'decoration_package', 'created_by')
    date_hierarchy = 'event_date'
    fieldsets = (
        (None, {
            'fields': (
                'tenant', 'booking_id', 'customer', 'venue', 'event_name',
                'event_date', 'slot', 'booking_status', 'created_by',
            ),
        }),
        ('Pricing & payment status', {
            'fields': ('total_price', 'advance_paid', 'payment_status', 'decoration_package'),
            'description': 'Payment records are managed under Finance → Payments (Manager/Admin only).',
        }),
    )
