from django.contrib import admin

from core.admin_mixins import TenantScopedAdminMixin

from .models import Customer


@admin.register(Customer)
class CustomerAdmin(TenantScopedAdminMixin, admin.ModelAdmin):
    list_display = ('display_name', 'phone', 'email', 'cnic', 'tenant', 'created_at')
    list_filter = ('tenant',)
    search_fields = ('full_name', 'first_name', 'last_name', 'phone', 'email', 'cnic')
    readonly_fields = ('created_at',)
