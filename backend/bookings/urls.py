from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BookingViewSet, MarriageHallPageVisibilityView

router = DefaultRouter()
router.register(r'', BookingViewSet, basename='booking')

urlpatterns = [
    path('page-visibility/', MarriageHallPageVisibilityView.as_view(), name='hall-page-visibility'),
    path('', include(router.urls)),
]
