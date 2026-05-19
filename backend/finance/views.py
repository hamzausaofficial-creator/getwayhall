from rest_framework import viewsets, filters, permissions
from django_filters.rest_framework import DjangoFilterBackend
from .models import Payment, Expense
from .serializers import PaymentSerializer, ExpenseSerializer

class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'payment_method', 'booking']
    ordering_fields = ['payment_date', 'amount']

    def get_queryset(self):
        return Payment.objects.all().select_related('booking')

    def perform_destroy(self, instance):
        booking = instance.booking
        if instance.status == 'COMPLETED':
            booking.advance_paid = max(0, booking.advance_paid - instance.amount)
            booking.save()
        instance.delete()

    def perform_update(self, serializer):
        old_instance = self.get_object()
        old_amount = old_instance.amount
        old_status = old_instance.status
        
        # Save the updated payment instance
        instance = serializer.save()
        
        booking = instance.booking
        
        # Deduct old completed payment amount if it was completed
        if old_status == 'COMPLETED':
            booking.advance_paid = max(0, booking.advance_paid - old_amount)
            
        # Add new completed payment amount if it is completed
        if instance.status == 'COMPLETED':
            booking.advance_paid += instance.amount
            
        booking.save()

class ExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category']
    search_fields = ['title', 'description']
    ordering_fields = ['expense_date', 'amount']

    def get_queryset(self):
        return Expense.objects.all()
