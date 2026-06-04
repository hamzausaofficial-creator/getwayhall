from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend

from core.mixins import TenantQuerysetMixin, TenantAssignMixin
from core.permissions import IsAdminOrManagerOrReadOnly, IsTenantOwner
from .models import Venue
from .serializers import VenueSerializer


class VenueViewSet(TenantQuerysetMixin, TenantAssignMixin, viewsets.ModelViewSet):
    queryset = Venue.objects.all().order_by('name')
    serializer_class = VenueSerializer
    permission_classes = [IsAdminOrManagerOrReadOnly, IsTenantOwner]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['name', 'location']
    ordering_fields = ['price_per_day', 'capacity', 'created_at']
