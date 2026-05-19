from rest_framework import permissions

class IsTenantOwner(permissions.BasePermission):
    """
    Permission to check if the user belongs to the tenant.
    """
    def has_object_permission(self, request, view, obj):
        # Assumes the object has a 'tenant' attribute
        return obj.tenant == request.user.tenant

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.role == 'ADMIN'
