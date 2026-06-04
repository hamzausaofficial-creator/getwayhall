from django.contrib import admin
from .models import DecorationPackage


@admin.register(DecorationPackage)
class DecorationPackageAdmin(admin.ModelAdmin):
    list_display = ('name', 'tier', 'base_price', 'is_active', 'tenant', 'display_order')
    list_filter = ('tier', 'is_active', 'tenant')
    search_fields = ('name', 'description')
