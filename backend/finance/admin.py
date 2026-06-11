from django.contrib import admin

from core.admin_mixins import ManagerOnlyAdminMixin, TenantScopedAdminMixin

from .models import Payment, Expense


@admin.register(Payment)
class PaymentAdmin(ManagerOnlyAdminMixin, TenantScopedAdminMixin, admin.ModelAdmin):
    list_display = (
        'id', 'booking', 'amount', 'payment_method', 'status',
        'payment_date', 'tenant', 'recorded_by',
    )
    list_filter = ('status', 'payment_method', 'tenant')
    search_fields = ('transaction_id', 'notes', 'booking__booking_id', 'booking__event_name')
    raw_id_fields = ('booking', 'recorded_by')
    date_hierarchy = 'payment_date'
    readonly_fields = ('payment_date',)


@admin.register(Expense)
class ExpenseAdmin(ManagerOnlyAdminMixin, TenantScopedAdminMixin, admin.ModelAdmin):
    list_display = ('title', 'category', 'amount', 'expense_date', 'tenant', 'created_by', 'created_at')
    list_filter = ('category', 'tenant')
    search_fields = ('title', 'description')
    raw_id_fields = ('created_by',)
    date_hierarchy = 'expense_date'
    readonly_fields = ('created_at',)
