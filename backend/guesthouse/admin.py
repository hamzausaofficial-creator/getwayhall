from django.contrib import admin
from django.utils.safestring import mark_safe

from core.admin_mixins import (
    AdminOnlyAdminMixin,
    ManagerOnlyAdminMixin,
    TenantScopedAdminMixin,
)
from core.models import Tenant

from .models import (
    Room,
    GuestHouseService,
    StayBooking,
    StayCharge,
    StayPayment,
    GhExpense,
    GuestHousePageVisibility,
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
        'id', 'stay', 'amount', 'payment_method', 'status',
        'payment_date', 'tenant', 'recorded_by',
    )
    list_filter = ('status', 'payment_method', 'tenant')
    search_fields = ('notes', 'stay__booking_ref', 'stay__customer__full_name')
    raw_id_fields = ('stay', 'recorded_by')
    date_hierarchy = 'payment_date'
    readonly_fields = ('payment_date',)


@admin.register(GhExpense)
class GhExpenseAdmin(ManagerOnlyAdminMixin, TenantScopedAdminMixin, admin.ModelAdmin):
    list_display = ('title', 'category', 'amount', 'expense_date', 'tenant', 'created_by')
    list_filter = ('category', 'tenant')
    search_fields = ('title', 'description')
    raw_id_fields = ('created_by',)
    date_hierarchy = 'expense_date'


class GuestHousePageInline(admin.TabularInline):
    """Hide/show Guest House pages inside Tenant edit screen."""
    model = GuestHousePageVisibility
    extra = 0
    fields = ('label', 'page_key', 'is_visible')
    readonly_fields = ('label', 'page_key')
    ordering = ('sort_order',)
    can_delete = False
    verbose_name = 'Page'
    verbose_name_plural = (
        'Guest House pages — tick <strong>Page live</strong> to show, '
        'untick to put in <strong>maintenance mode</strong>'
    )

    def has_add_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(GuestHousePageVisibility)
class GuestHousePageVisibilityAdmin(AdminOnlyAdminMixin, admin.ModelAdmin):
    """Tick Page live to keep pages available; untick for maintenance mode."""

    list_display = ('label', 'page_key', 'entry_kind', 'tenant', 'status_badge', 'is_visible')
    list_display_links = ('label',)
    list_editable = ('is_visible',)
    list_filter = ('tenant', 'is_visible')
    search_fields = ('label', 'page_key', 'tenant__name')
    ordering = ('tenant__name', 'sort_order', 'page_key')
    list_per_page = 50
    list_select_related = ('tenant',)
    readonly_fields = ('page_key', 'label', 'sort_order', 'tenant')

    fieldsets = (
        (None, {
            'fields': ('tenant', 'label', 'page_key', 'is_visible', 'sort_order'),
            'description': (
                'Uncheck <strong>Page live</strong> to put a sidebar page or in-app module '
                '(e.g. ID card scanner) in <strong>maintenance mode</strong>. '
                'Users see an “Under maintenance” screen instead.'
            ),
        }),
    )

    @admin.display(description='Type')
    def entry_kind(self, obj):
        if obj.page_key in GH_MODULE_KEYS:
            return mark_safe('<span style="color:#7c3aed;font-weight:600;">Module</span>')
        return mark_safe('<span style="color:#0369a1;font-weight:600;">Page</span>')

    @admin.display(description='Status')
    def status_badge(self, obj):
        if obj.is_visible:
            return mark_safe('<span style="color:#15803d;font-weight:700;">Live</span>')
        return mark_safe('<span style="color:#b45309;font-weight:700;">Maintenance</span>')

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def changelist_view(self, request, extra_context=None):
        for tenant in Tenant.objects.all():
            ensure_tenant_gh_pages(tenant)
        extra_context = extra_context or {}
        extra_context['title'] = 'Guest House — Page maintenance mode'
        extra_context['subtitle'] = (
            'Tick <strong>Page live</strong> to keep a page or module available. '
            'Untick to hide it and show an “Under maintenance” message to users. '
            'Press <strong>Save</strong> at the bottom after changes.'
        )
        return super().changelist_view(request, extra_context=extra_context)
