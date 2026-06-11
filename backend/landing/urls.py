from django.urls import path

from .views import LandingContentView, LandingLiveStatsView

urlpatterns = [
    path('', LandingContentView.as_view(), name='landing-content'),
    path('stats/', LandingLiveStatsView.as_view(), name='landing-live-stats'),
]
