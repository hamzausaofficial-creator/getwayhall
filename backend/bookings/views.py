from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction

from core.mixins import TenantQuerysetMixin, TenantAssignMixin
from core.permissions import IsAdminOrManagerOrReadOnly, IsTenantOwner
from .models import Booking
from .serializers import BookingSerializer


class BookingViewSet(TenantQuerysetMixin, TenantAssignMixin, viewsets.ModelViewSet):
    queryset = Booking.objects.all().order_by('-event_date', '-id')
    serializer_class = BookingSerializer
    permission_classes = [IsAdminOrManagerOrReadOnly, IsTenantOwner]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['booking_status', 'payment_status', 'venue', 'customer', 'decoration_package']
    search_fields = ['event_name', 'customer__first_name', 'customer__last_name', 'customer__full_name']
    ordering_fields = ['start_date', 'created_at']

    def get_queryset(self):
        return super().get_queryset().select_related('customer', 'venue', 'decoration_package')

    @transaction.atomic
    def perform_create(self, serializer):
        super().perform_create(serializer)
