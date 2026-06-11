from django.contrib import admin

from core.admin_mixins import TenantScopedAdminMixin

from .models import Venue


@admin.register(Venue)
class VenueAdmin(TenantScopedAdminMixin, admin.ModelAdmin):
    list_display = (
        'name', 'location', 'capacity', 'price_per_day',
        'status', 'tenant', 'created_at',
    )
    list_filter = ('status', 'tenant')
    search_fields = ('name', 'location', 'description')
    readonly_fields = ('created_at', 'updated_at')
