from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from core.admin_mixins import AdminOnlyAdminMixin, TenantScopedAdminMixin

from .models import User, StaffProfile


class StaffProfileInline(admin.StackedInline):
    model = StaffProfile
    can_delete = True
    extra = 0
    fk_name = 'user'


@admin.register(User)
class UserAdmin(AdminOnlyAdminMixin, BaseUserAdmin):
    list_display = (
        'username', 'email', 'first_name', 'last_name',
        'role', 'app_type', 'tenant', 'is_staff', 'is_active',
    )
    list_filter = ('role', 'app_type', 'tenant', 'is_staff', 'is_active', 'is_superuser')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('username',)
    inlines = [StaffProfileInline]

    fieldsets = BaseUserAdmin.fieldsets + (
        ('Gateway access', {
            'fields': ('role', 'app_type', 'tenant', 'profile_picture'),
            'description': (
                '<strong>Staff</strong> - bookings/stays only (no payments in app). '
                '<strong>Manager</strong> - full operations. <strong>Admin</strong> - all settings.'
            ),
        }),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Gateway access', {
            'fields': ('role', 'app_type', 'tenant', 'email'),
        }),
    )


@admin.register(StaffProfile)
class StaffProfileAdmin(AdminOnlyAdminMixin, TenantScopedAdminMixin, admin.ModelAdmin):
    list_display = ('user', 'tenant', 'phone', 'salary', 'joining_date', 'status')
    list_filter = ('tenant', 'status')
    search_fields = ('user__username', 'user__email', 'phone')
    raw_id_fields = ('user',)
