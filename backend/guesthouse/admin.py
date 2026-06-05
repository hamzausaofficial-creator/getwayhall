from django.contrib import admin
from django.utils.safestring import mark_safe

from core.models import Tenant

from .models import Room, StayBooking, StayPayment, GhExpense, GuestHousePageVisibility
from .page_visibility import ensure_tenant_gh_pages


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('room_number', 'room_type', 'tenant', 'price_per_night', 'status')
    list_filter = ('status', 'room_type', 'tenant')


@admin.register(StayBooking)
class StayBookingAdmin(admin.ModelAdmin):
    list_display = ('booking_ref', 'room', 'customer', 'check_in', 'check_out', 'status', 'tenant')
    list_filter = ('status', 'payment_status', 'tenant')


@admin.register(StayPayment)
class StayPaymentAdmin(admin.ModelAdmin):
    list_display = ('id', 'stay', 'amount', 'payment_method', 'status', 'tenant')


@admin.register(GhExpense)
class GhExpenseAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'amount', 'expense_date', 'tenant')


class GuestHousePageInline(admin.TabularInline):
    """Hide/show Guest House pages inside Tenant edit screen."""
    model = GuestHousePageVisibility
    extra = 0
    fields = ('label', 'page_key', 'is_visible')
    readonly_fields = ('label', 'page_key')
    ordering = ('sort_order',)
    can_delete = False
    verbose_name = 'Page'
    verbose_name_plural = 'Guest House pages — tick Is visible to show, untick to hide'

    def has_add_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(GuestHousePageVisibility)
class GuestHousePageVisibilityAdmin(admin.ModelAdmin):
    """Tick/untick Is visible checkboxes, then click Save at the bottom."""

    list_display = ('label', 'page_key', 'tenant', 'visibility_badge', 'is_visible')
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
                'Uncheck <strong>Is visible</strong> to hide this page from the Guest House app sidebar.'
            ),
        }),
    )

    @admin.display(description='Status')
    def visibility_badge(self, obj):
        if obj.is_visible:
            return mark_safe('<span style="color:#15803d;font-weight:700;">Visible</span>')
        return mark_safe('<span style="color:#b91c1c;font-weight:700;">Hidden</span>')

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def changelist_view(self, request, extra_context=None):
        for tenant in Tenant.objects.all():
            ensure_tenant_gh_pages(tenant)
        extra_context = extra_context or {}
        extra_context['title'] = 'Guest House — Hide / Show Pages'
        extra_context['subtitle'] = (
            'Tick or untick the <strong>Is visible</strong> checkboxes below, '
            'then press <strong>Save</strong> at the bottom of the page.'
        )
        return super().changelist_view(request, extra_context=extra_context)
