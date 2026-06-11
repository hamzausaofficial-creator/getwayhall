from django.contrib import admin

from core.admin_mixins import TenantScopedAdminMixin

from .models import InventoryItem, BookingInventoryItem


@admin.register(InventoryItem)
class InventoryItemAdmin(TenantScopedAdminMixin, admin.ModelAdmin):
    list_display = (
        'name', 'category', 'quantity', 'unit', 'price_per_unit',
        'status', 'tenant', 'last_restocked',
    )
    list_filter = ('category', 'status', 'tenant')
    search_fields = ('name', 'description')


@admin.register(BookingInventoryItem)
class BookingInventoryItemAdmin(TenantScopedAdminMixin, admin.ModelAdmin):
    list_display = ('booking', 'inventory_item', 'quantity_used', 'tenant')
    list_filter = ('tenant',)
    search_fields = ('booking__booking_id', 'booking__event_name', 'inventory_item__name')
    raw_id_fields = ('booking', 'inventory_item')
