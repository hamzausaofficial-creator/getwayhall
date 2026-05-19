from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count
from django.utils import timezone
from bookings.models import Booking
from finance.models import Payment, Expense
from venues.models import Venue

class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = request.user.tenant
        
        period = request.GET.get('period', 'all')
        start_date_str = request.GET.get('start_date')
        end_date_str = request.GET.get('end_date')
        
        now = timezone.localtime(timezone.now())
        start_date = None
        end_date = None
        
        import datetime
        from django.utils.dateparse import parse_date
        
        if start_date_str and end_date_str:
            try:
                start_date_val = parse_date(start_date_str)
                end_date_val = parse_date(end_date_str)
                if start_date_val and end_date_val:
                    start_date = timezone.make_aware(datetime.datetime.combine(start_date_val, datetime.time.min))
                    end_date = timezone.make_aware(datetime.datetime.combine(end_date_val, datetime.time.max))
            except:
                pass
        elif period == 'today':
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = now.replace(hour=23, minute=59, second=59, microsecond=999999)
        elif period == 'last7days':
            start_date = (now - datetime.timedelta(days=7)).replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = now.replace(hour=23, minute=59, second=59, microsecond=999999)
        elif period == 'thismonth':
            start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            end_date = now.replace(hour=23, minute=59, second=59, microsecond=999999)
        elif period == 'thisyear':
            start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            end_date = now.replace(hour=23, minute=59, second=59, microsecond=999999)

        if tenant:
            payment_qs = Payment.objects.filter(tenant=tenant)
            expense_qs = Expense.objects.filter(tenant=tenant)
            booking_qs = Booking.objects.filter(tenant=tenant)
        else:
            payment_qs = Payment.objects.all()
            expense_qs = Expense.objects.all()
            booking_qs = Booking.objects.all()
        
        if start_date and end_date:
            payment_qs = payment_qs.filter(payment_date__gte=start_date, payment_date__lte=end_date)
            # expense_date is DateField, need to extract date
            expense_qs = expense_qs.filter(expense_date__gte=start_date.date(), expense_date__lte=end_date.date())
            booking_qs = booking_qs.filter(created_at__gte=start_date, created_at__lte=end_date)

        # Financial Stats
        total_revenue = payment_qs.filter(
            status='COMPLETED'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        total_expenses = expense_qs.aggregate(total=Sum('amount'))['total'] or 0
        
        # Booking Stats
        total_bookings = booking_qs.count()
        pending_payments = booking_qs.filter(
            payment_status='PARTIAL'
        ).aggregate(total=Sum('remaining_balance'))['total'] or 0
        
        # Recent Activity (Always get recent regardless of filter, or based on filter)
        recent_bookings = booking_qs.order_by('-created_at')[:5]
        
        # Occupancy Rate (Simplistic: booked days in current month / total capacity days)
        # This is a placeholder for more complex logic
        
        # Revenue Growth (Last 6 Months)
        from django.db.models.functions import TruncMonth
        revenue_growth = payment_qs.filter(status='COMPLETED') \
            .annotate(month=TruncMonth('payment_date')) \
            .values('month') \
            .annotate(revenue=Sum('amount')) \
            .order_by('month')[:6]

        # Bookings by Hall
        bookings_by_hall = booking_qs \
            .values('venue__name') \
            .annotate(value=Count('id')) \
            .order_by('-value')

        return Response({
            'total_revenue': total_revenue,
            'total_expenses': total_expenses,
            'net_profit': total_revenue - total_expenses,
            'total_bookings': total_bookings,
            'pending_payments': pending_payments,
            'revenue_growth': [
                {'month': item['month'].strftime('%b'), 'revenue': float(item['revenue'])}
                for item in revenue_growth if item['month']
            ],
            'bookings_by_hall': [
                {'name': item['venue__name'], 'value': item['value']}
                for item in bookings_by_hall
            ],
            'recent_bookings': [
                {'id': b.id, 'event': b.event_name, 'customer': f"{b.customer.first_name} {b.customer.last_name}", 'status': b.booking_status}
                for b in recent_bookings
            ]
        })
