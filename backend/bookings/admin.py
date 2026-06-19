from django.contrib import admin
from django.utils.safestring import mark_safe

from core.admin_mixins import AdminOnlyAdminMixin, TenantScopedAdminMixin
from core.models import Tenant

from .models import (
    Booking,
    MarriageHallPageLive,
    MarriageHallPageMaintenance,
)
from .page_visibility import ensure_tenant_hall_pages


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


class _HallPageAdminBase(AdminOnlyAdminMixin, admin.ModelAdmin):
    list_display_links = ('label',)
    list_filter = ('tenant',)
    search_fields = ('label', 'page_key', 'tenant__name')
    ordering = ('tenant__name', 'sort_order', 'page_key')
    list_per_page = 50
    list_select_related = ('tenant',)
    readonly_fields = ('page_key', 'label', 'sort_order', 'tenant')

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def changelist_view(self, request, extra_context=None):
        for tenant in Tenant.objects.all():
            ensure_tenant_hall_pages(tenant)
        return super().changelist_view(request, extra_context=extra_context)


class MarriageHallPageLiveInline(admin.TabularInline):
    """Show/hide Marriage Hall pages inside Tenant edit screen."""
    model = MarriageHallPageLive
    extra = 0
    fields = ('label', 'page_key', 'is_visible')
    readonly_fields = ('label', 'page_key')
    ordering = ('sort_order',)
    can_delete = False
    verbose_name = 'Page'
    verbose_name_plural = (
        'Marriage Hall — <strong>Show/hide (live)</strong>: tick to show in menu, untick to hide'
    )

    def has_add_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


class MarriageHallPageMaintenanceInline(admin.TabularInline):
    """Maintenance mode for Marriage Hall pages inside Tenant edit screen."""
    model = MarriageHallPageMaintenance
    extra = 0
    fields = ('label', 'page_key', 'in_maintenance', 'maintenance_until')
    readonly_fields = ('label', 'page_key')
    ordering = ('sort_order',)
    can_delete = False
    verbose_name = 'Page'
    verbose_name_plural = (
        'Marriage Hall — <strong>Maintenance mode</strong>: set end date/time to auto-reopen the page'
    )

    def has_add_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(MarriageHallPageLive)
class MarriageHallPageLiveAdmin(_HallPageAdminBase):
    """Tick Show in menu to display a page; untick to hide it."""

    list_display = ('label', 'page_key', 'tenant', 'live_badge', 'is_visible')
    list_editable = ('is_visible',)

    fieldsets = (
        (None, {
            'fields': ('tenant', 'label', 'page_key', 'is_visible', 'sort_order'),
            'description': (
                'Tick <strong>Show in menu</strong> to display this page in the app. '
                'Untick to hide it from the sidebar and block direct URL access.'
            ),
        }),
    )

    @admin.display(description='Status')
    def live_badge(self, obj):
        if obj.is_visible:
            return mark_safe('<span style="color:#15803d;font-weight:700;">Live</span>')
        return mark_safe('<span style="color:#64748b;font-weight:700;">Hidden</span>')

    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context['title'] = 'Marriage Hall — Show/hide pages (live)'
        extra_context['subtitle'] = (
            'Tick <strong>Show in menu</strong> to keep a page visible. '
            'Untick to hide it from users. Press <strong>Save</strong> after changes.'
        )
        return super().changelist_view(request, extra_context=extra_context)


@admin.register(MarriageHallPageMaintenance)
class MarriageHallPageMaintenanceAdmin(_HallPageAdminBase):
    """Tick Maintenance mode to show an “Under maintenance” screen when users open the page."""

    list_display = ('label', 'page_key', 'tenant', 'maintenance_badge', 'in_maintenance', 'ends_at_display')
    list_editable = ('in_maintenance',)

    fieldsets = (
        (None, {
            'fields': ('tenant', 'label', 'page_key', 'in_maintenance', 'maintenance_until', 'sort_order'),
            'description': (
                'Tick <strong>Maintenance mode</strong> to show an “Under maintenance” screen. '
                'Set <strong>Maintenance ends at</strong> to schedule when the page reopens automatically.'
            ),
        }),
    )

    @admin.display(description='Ends at')
    def ends_at_display(self, obj):
        if obj.maintenance_until:
            return obj.maintenance_until.strftime('%d %b %Y, %I:%M %p')
        return '—'

    @admin.display(description='Status')
    def maintenance_badge(self, obj):
        if obj.in_maintenance:
            return mark_safe('<span style="color:#b45309;font-weight:700;">Maintenance</span>')
        return mark_safe('<span style="color:#15803d;font-weight:700;">Normal</span>')

    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context['title'] = 'Marriage Hall — Maintenance mode'
        extra_context['subtitle'] = (
            'Tick <strong>Maintenance mode</strong> and set <strong>Maintenance ends at</strong> '
            'so the page reopens automatically. Press <strong>Save</strong> after changes.'
        )
        return super().changelist_view(request, extra_context=extra_context)
