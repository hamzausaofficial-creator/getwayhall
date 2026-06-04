from django.contrib import admin
from .models import Room, StayBooking, StayPayment, GhExpense


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
