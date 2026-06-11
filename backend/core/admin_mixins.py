"""Shared Django admin mixins - role and tenant scoping aligned with API permissions."""


def gateway_role(user):
    if not user.is_authenticated:
        return None
    if user.is_superuser:
        return 'SUPERUSER'
    return getattr(user, 'role', None) or 'STAFF'


def can_manage_in_admin(user):
    return user.is_superuser or gateway_role(user) in ('ADMIN', 'MANAGER')


def is_admin_in_admin(user):
    return user.is_superuser or gateway_role(user) == 'ADMIN'


class TenantScopedAdminMixin:
    """Limit list/edit to the logged-in user's tenant (superusers see all)."""

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        tenant_id = getattr(request.user, 'tenant_id', None)
        if tenant_id and hasattr(qs.model, 'tenant'):
            return qs.filter(tenant_id=tenant_id)
        return qs.none()

    def save_model(self, request, obj, form, change):
        if (
            not change
            and hasattr(obj, 'tenant_id')
            and not obj.tenant_id
            and getattr(request.user, 'tenant_id', None)
        ):
            obj.tenant = request.user.tenant
        super().save_model(request, obj, form, change)


class ManagerOnlyAdminMixin:
    """Payments, expenses, reports - ADMIN and MANAGER only (no STAFF)."""

    def has_module_permission(self, request):
        return can_manage_in_admin(request.user) and super().has_module_permission(request)

    def has_view_permission(self, request, obj=None):
        return can_manage_in_admin(request.user) and super().has_view_permission(request, obj)

    def has_add_permission(self, request):
        return can_manage_in_admin(request.user) and super().has_add_permission(request)

    def has_change_permission(self, request, obj=None):
        return can_manage_in_admin(request.user) and super().has_change_permission(request, obj)

    def has_delete_permission(self, request, obj=None):
        return can_manage_in_admin(request.user) and super().has_delete_permission(request, obj)


class AdminOnlyAdminMixin:
    """Users, tenants, GH page visibility - ADMIN / superuser only."""

    def has_module_permission(self, request):
        return is_admin_in_admin(request.user) and super().has_module_permission(request)

    def has_view_permission(self, request, obj=None):
        return is_admin_in_admin(request.user) and super().has_view_permission(request, obj)

    def has_add_permission(self, request):
        return is_admin_in_admin(request.user) and super().has_add_permission(request)

    def has_change_permission(self, request, obj=None):
        return is_admin_in_admin(request.user) and super().has_change_permission(request, obj)

    def has_delete_permission(self, request, obj=None):
        return is_admin_in_admin(request.user) and super().has_delete_permission(request, obj)
