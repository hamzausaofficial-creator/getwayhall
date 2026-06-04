"""Shared DRF mixins for tenant-scoped APIs."""


class TenantQuerysetMixin:
    """Restrict list/detail to the authenticated user's tenant."""

    tenant_field = 'tenant'

    def _base_queryset(self):
        if self.queryset is not None:
            return super().get_queryset()
        serializer = getattr(self, 'serializer_class', None)
        model = getattr(getattr(serializer, 'Meta', None), 'model', None)
        if model is not None:
            return model.objects.all()
        return super().get_queryset()

    def get_queryset(self):
        qs = self._base_queryset()
        user = self.request.user
        if user.is_authenticated and user.is_superuser and not user.tenant_id:
            return qs
        if not getattr(user, 'tenant_id', None):
            return qs.none()
        return qs.filter(**{self.tenant_field: user.tenant})


class TenantAssignMixin:
    """Attach tenant on create when the model has a tenant FK."""

    def perform_create(self, serializer):
        user = self.request.user
        extra = {}
        if getattr(user, 'tenant_id', None):
            extra['tenant'] = user.tenant
        serializer.save(**extra)
