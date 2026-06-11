from django.contrib import admin

from core.admin_mixins import TenantScopedAdminMixin

from .models import DecorationPackage


@admin.register(DecorationPackage)
class DecorationPackageAdmin(TenantScopedAdminMixin, admin.ModelAdmin):
    list_display = ('name', 'tier', 'base_price', 'is_active', 'tenant', 'display_order')
    list_filter = ('tier', 'is_active', 'tenant')
    search_fields = ('name', 'description')
