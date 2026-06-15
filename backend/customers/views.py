from rest_framework import viewsets, filters, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, F
from django.db.models.functions import Greatest
from decimal import Decimal

from core.mixins import TenantQuerysetMixin, TenantAssignMixin
from core.permissions import IsCustomerWritable, IsTenantOwner
from .models import Customer
from .serializers import CustomerSerializer
from bookings.models import Booking
from bookings.serializers import BookingSerializer


class CustomerViewSet(TenantQuerysetMixin, TenantAssignMixin, viewsets.ModelViewSet):
    queryset = Customer.objects.all().order_by('-created_at')
    serializer_class = CustomerSerializer
    permission_classes = [IsCustomerWritable, IsTenantOwner]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['full_name', 'first_name', 'last_name', 'cnic', 'email', 'phone']
    ordering_fields = ['created_at', 'last_name']

    @action(detail=True, methods=['get'], url_path='summary')
    def summary(self, request, pk=None):
        """Customer profile with bookings/stays and outstanding balance."""
        customer = self.get_object()
        user = request.user
        tenant_id = getattr(user, 'tenant_id', None)
        app = request.query_params.get('app', 'hall')

        if app == 'guesthouse':
            from guesthouse.models import StayBooking
            from guesthouse.serializers import StayBookingSerializer

            stays_qs = StayBooking.objects.filter(customer=customer).select_related(
                'room', 'customer'
            ).order_by('-check_in', '-created_at')
            if tenant_id:
                stays_qs = stays_qs.filter(tenant_id=tenant_id)

            outstanding = stays_qs.exclude(status='CANCELLED').annotate(
                due=Greatest(F('total_amount') - F('advance_paid'), Decimal('0'))
            ).aggregate(total=Sum('due'))['total'] or Decimal('0')
            stays_data = StayBookingSerializer(
                stays_qs, many=True, context={'request': request}
            ).data

            return Response({
                'customer': CustomerSerializer(customer, context={'request': request}).data,
                'stays': stays_data,
                'stays_count': len(stays_data),
                'total_outstanding': float(outstanding),
            })

        bookings_qs = Booking.objects.filter(customer=customer).select_related('venue').order_by(
            '-event_date', '-created_at'
        )
        if tenant_id:
            bookings_qs = bookings_qs.filter(tenant=user.tenant)

        outstanding = bookings_qs.exclude(booking_status='CANCELLED').aggregate(
            total=Sum('remaining_balance')
        )['total'] or Decimal('0')
        bookings_data = BookingSerializer(bookings_qs, many=True, context={'request': request}).data

        return Response({
            'customer': CustomerSerializer(customer, context={'request': request}).data,
            'bookings': bookings_data,
            'bookings_count': len(bookings_data),
            'total_outstanding': float(outstanding),
        })
