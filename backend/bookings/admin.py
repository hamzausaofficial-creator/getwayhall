from django.contrib import admin
from django.utils.safestring import mark_safe

from core.admin_mixins import AdminOnlyAdminMixin, TenantScopedAdminMixin
from core.models import Tenant

from .models import Booking, MarriageHallPageVisibility
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


class MarriageHallPageInline(admin.TabularInline):
    """Maintenance mode for Marriage Hall pages inside Tenant edit screen."""
    model = MarriageHallPageVisibility
    extra = 0
    fields = ('label', 'page_key', 'is_visible')
    readonly_fields = ('label', 'page_key')
    ordering = ('sort_order',)
    can_delete = False
    verbose_name = 'Page'
    verbose_name_plural = (
        'Marriage Hall pages — tick <strong>Page live</strong> to show, '
        'untick to put in <strong>maintenance mode</strong>'
    )

    def has_add_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(MarriageHallPageVisibility)
class MarriageHallPageVisibilityAdmin(AdminOnlyAdminMixin, admin.ModelAdmin):
    list_display = ('label', 'page_key', 'tenant', 'status_badge', 'is_visible')
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
                'Uncheck <strong>Page live</strong> to put this page in '
                '<strong>maintenance mode</strong>. Users will see an '
                '“Under maintenance” screen instead of the page.'
            ),
        }),
    )

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
            ensure_tenant_hall_pages(tenant)
        extra_context = extra_context or {}
        extra_context['title'] = 'Marriage Hall — Page maintenance mode'
        extra_context['subtitle'] = (
            'Tick <strong>Page live</strong> to keep a page available. '
            'Untick to hide it and show an “Under maintenance” message to users. '
            'Press <strong>Save</strong> at the bottom after changes.'
        )
        return super().changelist_view(request, extra_context=extra_context)
