from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend

from core.mixins import TenantQuerysetMixin
from core.permissions import (
    IsAdminOrManager,
    IsAdminOrManagerOrReadOnly,
    IsAdminOrManagerNoStaff,
    IsTenantOwner,
    IsMarriageHallApp,
)
from .models import Payment, Expense
from .serializers import PaymentSerializer, ExpenseSerializer


class PaymentViewSet(TenantQuerysetMixin, viewsets.ModelViewSet):
    queryset = Payment.objects.all().order_by('-payment_date', '-id')
    serializer_class = PaymentSerializer
    permission_classes = [IsMarriageHallApp, IsAdminOrManager, IsTenantOwner]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'payment_method', 'booking']
    ordering_fields = ['payment_date', 'amount']

    def get_queryset(self):
        return super().get_queryset().select_related(
            'booking', 'booking__customer', 'booking__venue', 'recorded_by'
        )


class ExpenseViewSet(TenantQuerysetMixin, viewsets.ModelViewSet):
    queryset = Expense.objects.all().order_by('-expense_date', '-id')
    serializer_class = ExpenseSerializer
    permission_classes = [IsMarriageHallApp, IsAdminOrManagerNoStaff, IsTenantOwner]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category']
    search_fields = ['title', 'description']
    ordering_fields = ['expense_date', 'amount']
