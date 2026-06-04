from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InventoryItemViewSet, BookingInventoryItemViewSet

router = DefaultRouter()
router.register(r'items', InventoryItemViewSet, basename='inventory')
router.register(r'booking-items', BookingInventoryItemViewSet, basename='booking-inventory')

urlpatterns = [
    path('', include(router.urls)),
]
