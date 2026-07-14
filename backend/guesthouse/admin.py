from django.contrib import admin
from django.utils.safestring import mark_safe

from core.admin_mixins import (
    AdminOnlyAdminMixin,
    ManagerOnlyAdminMixin,
    TenantScopedAdminMixin,
)
from core.maintenance_admin import MaintenanceUntilAdminMixin
from core.maintenance_forms import GuestHousePageMaintenanceForm
from core.models import Tenant

from .models import (
    Room,
    GuestHouseService,
    StayBooking,
    StayCharge,
    StayPayment,
    GhExpense,
    GuestHousePageLive,
    GuestHousePageMaintenance,
)
from .page_visibility import ensure_tenant_gh_pages, GH_MODULE_KEYS


@admin.register(Room)
class RoomAdmin(TenantScopedAdminMixin, admin.ModelAdmin):
    list_display = (
        'room_number', 'room_type', 'beds', 'included_guests',
        'extra_guest_fee_per_night', 'price_per_night', 'status', 'tenant',
    )
    list_filter = ('status', 'room_type', 'tenant')
    search_fields = ('room_number', 'description')
    fieldsets = (
        (None, {
            'fields': ('tenant', 'room_number', 'room_type', 'beds', 'status', 'description', 'image'),
        }),
        ('Billing', {
            'fields': ('price_per_night', 'included_guests', 'extra_guest_fee_per_night'),
            'description': 'Included guests: 0 = use bed count. Extra guest fee applies per additional guest per night.',
        }),
    )


@admin.register(GuestHouseService)
class GuestHouseServiceAdmin(TenantScopedAdminMixin, admin.ModelAdmin):
    list_display = ('label', 'code', 'price', 'pricing_unit', 'is_active', 'sort_order', 'tenant')
    list_filter = ('pricing_unit', 'is_active', 'tenant')
    search_fields = ('label', 'code')
    list_editable = ('is_active', 'sort_order')
    ordering = ('tenant', 'sort_order', 'label')


class StayChargeInline(admin.TabularInline):
    model = StayCharge
    extra = 0
    fields = ('charge_type', 'service', 'description', 'quantity', 'unit_price', 'amount')
    readonly_fields = ('amount',)
    raw_id_fields = ('service',)
    show_change_link = True


@admin.register(StayBooking)
class StayBookingAdmin(TenantScopedAdminMixin, admin.ModelAdmin):
    list_display = (
        'booking_ref', 'customer', 'room', 'check_in', 'check_out',
        'guests_count', 'total_amount', 'advance_paid', 'status', 'payment_status', 'tenant',
    )
    list_filter = ('status', 'payment_status', 'tenant')
    search_fields = (
        'booking_ref', 'customer__full_name', 'customer__first_name',
        'customer__last_name', 'customer__phone', 'room__room_number',
    )
    raw_id_fields = ('customer', 'room', 'created_by')
    readonly_fields = ('booking_ref', 'created_at', 'updated_at')
    date_hierarchy = 'check_in'
    inlines = [StayChargeInline]
    fieldsets = (
        (None, {
            'fields': (
                'tenant', 'booking_ref', 'customer', 'room',
                'check_in', 'check_out', 'guests_count', 'status', 'notes', 'created_by',
            ),
        }),
        ('Amounts', {
            'fields': ('total_amount', 'advance_paid', 'payment_status'),
            'description': 'Totals recalculate on save from room rate, extra guests, and add-on charges.',
        }),
    )


@admin.register(StayCharge)
class StayChargeAdmin(TenantScopedAdminMixin, admin.ModelAdmin):
    list_display = ('stay', 'charge_type', 'description', 'quantity', 'unit_price', 'amount', 'service')
    list_filter = ('charge_type',)
    search_fields = ('description', 'stay__booking_ref')
    raw_id_fields = ('stay', 'service')

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        tenant_id = getattr(request.user, 'tenant_id', None)
        if tenant_id:
            return qs.filter(stay__tenant_id=tenant_id)
        return qs.none()


@admin.register(StayPayment)
class StayPaymentAdmin(ManagerOnlyAdminMixin, TenantScopedAdminMixin, admin.ModelAdmin):
    list_display = (
        'receipt_ref', 'id', 'stay', 'amount', 'payment_method', 'status',
        'payment_date', 'tenant', 'recorded_by',
    )
    list_filter = ('status', 'payment_method', 'tenant')
    search_fields = ('receipt_ref', 'notes', 'stay__booking_ref', 'stay__customer__full_name')
    raw_id_fields = ('stay', 'recorded_by')
    date_hierarchy = 'payment_date'
    readonly_fields = ('payment_date', 'receipt_ref')


@admin.register(GhExpense)
class GhExpenseAdmin(ManagerOnlyAdminMixin, TenantScopedAdminMixin, admin.ModelAdmin):
    list_display = ('title', 'category', 'amount', 'expense_date', 'tenant', 'created_by')
    list_filter = ('category', 'tenant')
    search_fields = ('title', 'description')
    raw_id_fields = ('created_by',)
    date_hierarchy = 'expense_date'


class _GhPageAdminBase(AdminOnlyAdminMixin, admin.ModelAdmin):
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

    @admin.display(description='Type')
    def entry_kind(self, obj):
        if obj.page_key in GH_MODULE_KEYS:
            return mark_safe('<span style="color:#7c3aed;font-weight:600;">Module</span>')
        return mark_safe('<span style="color:#0369a1;font-weight:600;">Page</span>')

    def changelist_view(self, request, extra_context=None):
        for tenant in Tenant.objects.all():
            ensure_tenant_gh_pages(tenant)
        return super().changelist_view(request, extra_context=extra_context)


class GuestHousePageLiveInline(admin.TabularInline):
    """Show/hide Guest House pages inside Tenant edit screen."""
    model = GuestHousePageLive
    extra = 0
    fields = ('label', 'page_key', 'is_visible')
    readonly_fields = ('label', 'page_key')
    ordering = ('sort_order',)
    can_delete = False
    verbose_name = 'Page'
    verbose_name_plural = (
        'Guest House — <strong>Show in menu</strong> (tick = page visible in app sidebar)'
    )

    def has_add_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


class GuestHousePageMaintenanceInline(admin.StackedInline):
    """Maintenance mode for Guest House pages inside Tenant edit screen."""
    model = GuestHousePageMaintenance
    form = GuestHousePageMaintenanceForm
    extra = 0
    fields = ('label', 'page_key', 'in_maintenance', 'maintenance_until')
    readonly_fields = ('label', 'page_key')
    ordering = ('sort_order',)
    can_delete = False
    verbose_name = 'Page'
    verbose_name_plural = (
        'Guest House — <strong>Maintenance & reopen time</strong> (set when page opens again)'
    )

    def has_add_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(GuestHousePageLive)
class GuestHousePageLiveAdmin(_GhPageAdminBase):
    """Tick Show in menu to display a page or module; untick to hide it."""

    list_display = ('label', 'page_key', 'entry_kind', 'tenant', 'live_badge', 'is_visible')
    list_editable = ('is_visible',)

    fieldsets = (
        (None, {
            'fields': ('tenant', 'label', 'page_key', 'is_visible', 'sort_order'),
            'description': (
                'Tick <strong>Show in menu</strong> to display this page or module in the app. '
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
        extra_context['title'] = 'Guest House — 1 · Show in menu'
        extra_context['subtitle'] = (
            '<strong>For:</strong> hiding or showing Guest House pages in the app sidebar. '
            'Tick <strong>Show in menu</strong> = visible. Untick = hidden. Save at the bottom.'
        )
        return super().changelist_view(request, extra_context=extra_context)


@admin.register(GuestHousePageMaintenance)
class GuestHousePageMaintenanceAdmin(MaintenanceUntilAdminMixin, _GhPageAdminBase):
    """Tick Maintenance mode and set when the page should reopen automatically."""

    form = GuestHousePageMaintenanceForm
    list_display = (
        'label', 'page_key', 'entry_kind', 'tenant', 'maintenance_badge',
        'ends_at_display', 'in_maintenance', 'maintenance_until',
    )
    list_editable = ('in_maintenance', 'maintenance_until')

    fieldsets = (
        (None, {
            'fields': ('tenant', 'label', 'page_key', 'in_maintenance', 'maintenance_until', 'sort_order'),
            'description': (
                'Tick <strong>Maintenance mode</strong>, then open a row to set '
                '<strong>Maintenance ends at</strong> using the date and 12-hour '
                '(AM/PM) time dropdowns.'
            ),
        }),
    )

    @admin.display(description='Status')
    def maintenance_badge(self, obj):
        if obj.in_maintenance:
            return mark_safe('<span style="color:#b45309;font-weight:700;">Maintenance</span>')
        return mark_safe('<span style="color:#15803d;font-weight:700;">Normal</span>')

    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context['title'] = 'Guest House — 2 · Maintenance & reopen time'
        extra_context['subtitle'] = (
            '<strong>For:</strong> putting pages under maintenance and scheduling when they reopen. '
            'Tick maintenance, pick <strong>date</strong> and <strong>time (AM/PM)</strong>, then Save. '
            'Saved time appears in the <strong>Saved end time</strong> column.'
        )
        return super().changelist_view(request, extra_context=extra_context)
