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

    def get_queryset(self):
        qs = super().get_queryset()
        if self.action != 'list':
            return qs
        primary_only = self.request.query_params.get('primary_only', '').lower() in ('1', 'true', 'yes')
        if not primary_only:
            return qs
        tenant_id = getattr(self.request.user, 'tenant_id', None)
        if not tenant_id:
            return qs
        from guesthouse.models import StayBooking, StayGuest

        primary_ids = StayBooking.objects.filter(tenant_id=tenant_id).values_list('customer_id', flat=True)
        companion_only_ids = (
            StayGuest.objects.filter(
                is_primary=False,
                customer_id__isnull=False,
                stay__tenant_id=tenant_id,
            )
            .exclude(customer_id__in=primary_ids)
            .values_list('customer_id', flat=True)
            .distinct()
        )
        # Primary bookers only: hide linked companion profiles and stay-only companions.
        return qs.filter(linked_primary__isnull=True).exclude(id__in=companion_only_ids)

    def _collect_travel_companions(self, customer, tenant_id):
        """Guests linked to this primary booker (saved profiles + past stay roster)."""
        from guesthouse.models import StayBooking, StayGuest

        companion_map = {}

        if tenant_id:
            linked_profiles = Customer.objects.filter(
                tenant_id=tenant_id,
                linked_primary_id=customer.id,
            )
            for profile in linked_profiles:
                key = profile.id
                companion_map[key] = {
                    'customer_id': profile.id,
                    'full_name': profile.display_name,
                    'cnic': profile.cnic or '',
                    'phone': profile.phone or '',
                    'address': profile.address or '',
                    'is_minor': bool(profile.is_minor),
                    'stays_together': 0,
                    'source': 'profile',
                }

            stays_qs = StayBooking.objects.filter(
                tenant_id=tenant_id,
                customer=customer,
            ).prefetch_related('guest_roster', 'guest_roster__customer')
            for stay in stays_qs:
                for guest in stay.guest_roster.all():
                    if guest.is_primary:
                        continue
                    key = guest.customer_id or (guest.cnic or '').strip() or guest.full_name
                    if not key:
                        continue
                    if key in companion_map:
                        companion_map[key]['stays_together'] += 1
                        continue
                    companion_map[key] = {
                        'customer_id': guest.customer_id,
                        'full_name': guest.full_name,
                        'cnic': guest.cnic or '',
                        'phone': guest.phone or '',
                        'address': guest.address or (guest.customer.address if guest.customer else '') or '',
                        'is_minor': bool(guest.is_minor or (guest.customer.is_minor if guest.customer else False)),
                        'stays_together': 1,
                        'source': 'stay',
                    }

        return sorted(
            companion_map.values(),
            key=lambda row: (row.get('is_minor', False), row.get('full_name', '')),
        )

    @action(detail=True, methods=['get'], url_path='travel-companions')
    def travel_companions(self, request, pk=None):
        customer = self.get_object()
        tenant_id = getattr(request.user, 'tenant_id', None)
        companions = self._collect_travel_companions(customer, tenant_id)
        return Response({'companions': companions})

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
                            'address': guest.address or '',
                            'is_minor': bool(guest.is_minor),
                            'stays_together': 0,
                        }
                    related_map[key]['stays_together'] += 1

            linked_profiles = Customer.objects.filter(
                tenant_id=tenant_id,
                linked_primary_id=customer.id,
            ) if tenant_id else Customer.objects.none()
            for profile in linked_profiles:
                key = profile.id
                if key not in related_map:
                    related_map[key] = {
                        'customer_id': profile.id,
                        'full_name': profile.display_name,
                        'cnic': profile.cnic or '',
                        'phone': profile.phone or '',
                        'address': profile.address or '',
                        'is_minor': bool(profile.is_minor),
                        'stays_together': 0,
                    }

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
