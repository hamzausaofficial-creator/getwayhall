from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RoomViewSet,
    GuestHouseServiceViewSet,
    StayBookingViewSet,
    StayPaymentViewSet,
    GhExpenseViewSet,
    GuestHouseDashboardStatsView,
    GuestHouseReportsView,
    GuestHouseCalendarView,
    GuestHouseRoomAvailabilityView,
    GuestHouseAlertsView,
    GuestHouseSearchView,
    GuestHousePageVisibilityView,
    GuestHouseRecordsView,
    GuestHouseDailyView,
)

router = DefaultRouter()
router.register(r'rooms', RoomViewSet, basename='gh-room')
router.register(r'services', GuestHouseServiceViewSet, basename='gh-service')
router.register(r'stays', StayBookingViewSet, basename='gh-stay')
router.register(r'payments', StayPaymentViewSet, basename='gh-payment')
router.register(r'expenses', GhExpenseViewSet, basename='gh-expense')

urlpatterns = [
    path('stats/', GuestHouseDashboardStatsView.as_view(), name='gh-dashboard-stats'),
    path('reports/', GuestHouseReportsView.as_view(), name='gh-reports'),
    path('calendar/', GuestHouseCalendarView.as_view(), name='gh-calendar'),
    path('rooms/available/', GuestHouseRoomAvailabilityView.as_view(), name='gh-room-availability'),
    path('alerts/', GuestHouseAlertsView.as_view(), name='gh-alerts'),
    path('search/', GuestHouseSearchView.as_view(), name='gh-search'),
    path('records/', GuestHouseRecordsView.as_view(), name='gh-records'),
    path('daily/', GuestHouseDailyView.as_view(), name='gh-daily'),
    path('page-visibility/', GuestHousePageVisibilityView.as_view(), name='gh-page-visibility'),
    path('', include(router.urls)),
]
