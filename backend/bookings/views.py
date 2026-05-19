from rest_framework import viewsets, filters, permissions
from django_filters.rest_framework import DjangoFilterBackend
from .models import Booking
from .serializers import BookingSerializer
from django.db import transaction

class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['booking_status', 'payment_status', 'venue']
    search_fields = ['event_name', 'customer__first_name', 'customer__last_name']
    ordering_fields = ['start_date', 'created_at']

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'tenant') and user.tenant:
            return Booking.objects.filter(tenant=user.tenant).select_related('customer', 'venue')
        return Booking.objects.all().select_related('customer', 'venue')

    @transaction.atomic
    def perform_create(self, serializer):
        serializer.save()
