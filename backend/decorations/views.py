from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend

from core.mixins import TenantQuerysetMixin, TenantAssignMixin
from core.permissions import IsAdminOrManagerOrReadOnly, IsTenantOwner
from .models import DecorationPackage
from .serializers import DecorationPackageSerializer


class DecorationPackageViewSet(TenantQuerysetMixin, TenantAssignMixin, viewsets.ModelViewSet):
    queryset = DecorationPackage.objects.all().order_by('display_order', 'name')
    serializer_class = DecorationPackageSerializer
    permission_classes = [IsAdminOrManagerOrReadOnly, IsTenantOwner]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tier', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'base_price', 'display_order', 'created_at', 'tier']
