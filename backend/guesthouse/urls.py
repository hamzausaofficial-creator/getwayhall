from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RoomViewSet,
    StayBookingViewSet,
    StayPaymentViewSet,
    GhExpenseViewSet,
    GuestHouseDashboardStatsView,
    GuestHouseReportsView,
    GuestHouseCalendarView,
    GuestHouseAlertsView,
    GuestHouseSearchView,
)

router = DefaultRouter()
router.register(r'rooms', RoomViewSet, basename='gh-room')
router.register(r'stays', StayBookingViewSet, basename='gh-stay')
router.register(r'payments', StayPaymentViewSet, basename='gh-payment')
router.register(r'expenses', GhExpenseViewSet, basename='gh-expense')

urlpatterns = [
    path('stats/', GuestHouseDashboardStatsView.as_view(), name='gh-dashboard-stats'),
    path('reports/', GuestHouseReportsView.as_view(), name='gh-reports'),
    path('calendar/', GuestHouseCalendarView.as_view(), name='gh-calendar'),
    path('alerts/', GuestHouseAlertsView.as_view(), name='gh-alerts'),
    path('search/', GuestHouseSearchView.as_view(), name='gh-search'),
    path('', include(router.urls)),
]
