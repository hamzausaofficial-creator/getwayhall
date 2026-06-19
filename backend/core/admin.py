from django.contrib import admin

from core.admin_mixins import AdminOnlyAdminMixin, ManagerOnlyAdminMixin, TenantScopedAdminMixin

from .models import Tenant, UserSettings, NotificationLog


@admin.register(Tenant)
class TenantAdmin(AdminOnlyAdminMixin, admin.ModelAdmin):
    list_display = ('name', 'subdomain', 'plan_type', 'is_active', 'sms_enabled', 'phone', 'created_at')
    list_filter = ('plan_type', 'is_active', 'sms_enabled')
    search_fields = ('name', 'subdomain', 'phone', 'address')
    readonly_fields = ('created_at', 'updated_at')

    def get_inlines(self, request, obj):
        from guesthouse.admin import GuestHousePageLiveInline, GuestHousePageMaintenanceInline
        from bookings.admin import MarriageHallPageLiveInline, MarriageHallPageMaintenanceInline
        return [
            GuestHousePageLiveInline,
            GuestHousePageMaintenanceInline,
            MarriageHallPageLiveInline,
            MarriageHallPageMaintenanceInline,
        ]

    def get_object(self, request, object_id, from_field=None):
        obj = super().get_object(request, object_id, from_field)
        if obj:
            from guesthouse.page_visibility import ensure_tenant_gh_pages
            from bookings.page_visibility import ensure_tenant_hall_pages
            ensure_tenant_gh_pages(obj)
            ensure_tenant_hall_pages(obj)
        return obj


@admin.register(UserSettings)
class UserSettingsAdmin(AdminOnlyAdminMixin, admin.ModelAdmin):
    list_display = (
        'user', 'theme', 'language', 'timezone',
        'notify_new_bookings', 'notify_payments', 'sms_to_customers',
    )
    list_filter = ('theme', 'language', 'notify_new_bookings', 'notify_payments')
    search_fields = ('user__username', 'user__email')
    raw_id_fields = ('user',)


@admin.register(NotificationLog)
class NotificationLogAdmin(ManagerOnlyAdminMixin, TenantScopedAdminMixin, admin.ModelAdmin):
    list_display = (
        'notification_type', 'status', 'recipient', 'tenant',
        'customer', 'booking', 'created_at', 'sent_at',
    )
    list_filter = ('notification_type', 'status', 'tenant')
    search_fields = ('recipient', 'message', 'error_message')
    readonly_fields = ('created_at', 'sent_at')
    raw_id_fields = ('tenant', 'booking', 'customer')
