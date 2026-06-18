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
            ).prefetch_related(
                'guest_roster', 'guest_roster__customer',
            ).order_by('-check_in', '-created_at')
            if tenant_id:
                stays_qs = stays_qs.filter(tenant_id=tenant_id)

            outstanding = stays_qs.exclude(status='CANCELLED').annotate(
                due=Greatest(F('total_amount') - F('advance_paid'), Decimal('0'))
            ).aggregate(total=Sum('due'))['total'] or Decimal('0')
            stays_list = list(stays_qs)
            stays_data = StayBookingSerializer(
                stays_list, many=True, context={'request': request}
            ).data

            related_map = {}
            for stay in stays_list:
                for guest in stay.guest_roster.all():
                    if guest.is_primary:
                        continue
                    key = guest.customer_id or (guest.cnic or '').strip() or guest.full_name
                    if not key:
                        continue
                    if key not in related_map:
                        related_map[key] = {
                            'customer_id': guest.customer_id,
                            'full_name': guest.full_name,
                            'cnic': guest.cnic or '',
                            'phone': guest.phone or '',
                            'stays_together': 0,
                        }
                    related_map[key]['stays_together'] += 1
            related_guests = list(related_map.values())

            return Response({
                'customer': CustomerSerializer(customer, context={'request': request}).data,
                'stays': stays_data,
                'stays_count': len(stays_data),
                'related_guests': related_guests,
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
