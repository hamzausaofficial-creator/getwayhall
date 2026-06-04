from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VenueViewSet, CustomerViewSet, BookingViewSet, PaymentViewSet, ExpenseViewSet, StaffViewSet, InventoryItemViewSet

router = DefaultRouter()
router.register(r'venues', VenueViewSet)
router.register(r'customers', CustomerViewSet)
router.register(r'bookings', BookingViewSet)
router.register(r'payments', PaymentViewSet)
router.register(r'expenses', ExpenseViewSet)
router.register(r'staff', StaffViewSet)
router.register(r'inventory', InventoryItemViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
