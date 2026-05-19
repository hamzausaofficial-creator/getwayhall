from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaymentViewSet, ExpenseViewSet

router = DefaultRouter()
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'expenses', ExpenseViewSet, basename='expense')

urlpatterns = [
    path('', include(router.urls)),
]
