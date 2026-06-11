from decimal import Decimal

from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from django.utils import timezone

from core.mixins import TenantQuerysetMixin, TenantAssignMixin
from core.permissions import IsAdminOrManagerOrReadOnly, IsTenantOwner, IsMarriageHallApp
from .models import Booking
from .serializers import BookingSerializer


class BookingViewSet(TenantQuerysetMixin, TenantAssignMixin, viewsets.ModelViewSet):
    queryset = Booking.objects.all().order_by('-event_date', '-id')
    serializer_class = BookingSerializer
    permission_classes = [IsMarriageHallApp, IsAdminOrManagerOrReadOnly, IsTenantOwner]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['booking_status', 'payment_status', 'venue', 'customer', 'decoration_package']
    search_fields = ['event_name', 'customer__first_name', 'customer__last_name', 'customer__full_name']
    ordering_fields = ['start_date', 'created_at']

    def get_queryset(self):
        return super().get_queryset().select_related('customer', 'venue', 'decoration_package')

    @transaction.atomic
    def perform_create(self, serializer):
        super().perform_create(serializer)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        booking = self.get_object()
        if booking.booking_status == 'CANCELLED':
            return Response({'detail': 'Booking is already cancelled.'}, status=400)
        if booking.booking_status == 'COMPLETED':
            return Response({'detail': 'Completed booking cannot be cancelled.'}, status=400)

        reason = (request.data.get('reason') or '').strip()
        refund_advance = bool(request.data.get('refund_advance', False))

        booking.booking_status = 'CANCELLED'
        booking.cancellation_reason = reason
        booking.cancelled_at = timezone.now()
        booking.remaining_balance = Decimal('0')
        booking.save()

        if refund_advance:
            paid = booking.advance_paid or Decimal('0')
            if paid > 0:
                from finance.models import Payment
                Payment.objects.create(
                    booking=booking,
                    amount=-paid,
                    payment_method='CASH',
                    status='COMPLETED',
                    notes='Refund on booking cancellation',
                    tenant=booking.tenant,
                    recorded_by=request.user if request.user.is_authenticated else None,
                )

        booking.refresh_from_db()
        return Response(BookingSerializer(booking, context={'request': request}).data)
