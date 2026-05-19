from rest_framework import viewsets
from .models import Venue, Customer, Booking, Payment, Expense, Staff
from .serializers import VenueSerializer, CustomerSerializer, BookingSerializer, PaymentSerializer, ExpenseSerializer, StaffSerializer
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Count, Sum
from datetime import datetime, timedelta

class VenueViewSet(viewsets.ModelViewSet):
    queryset = Venue.objects.all()
    serializer_class = VenueSerializer

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer

class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        total_bookings = Booking.objects.count()
        total_revenue = Booking.objects.filter(status='CONFIRMED').aggregate(Sum('total_price'))['total_price__sum'] or 0
        active_customers = Customer.objects.count()
        upcoming_events = Booking.objects.filter(start_date__gte=datetime.now().date()).count()

        return Response({
            'total_bookings': total_bookings,
            'total_revenue': total_revenue,
            'active_customers': active_customers,
            'upcoming_events': upcoming_events
        })

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer

class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer

class StaffViewSet(viewsets.ModelViewSet):
    queryset = Staff.objects.all()
    serializer_class = StaffSerializer
