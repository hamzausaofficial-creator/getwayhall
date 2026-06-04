from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DecorationPackageViewSet

router = DefaultRouter()
router.register(r'packages', DecorationPackageViewSet, basename='decoration-package')

urlpatterns = [
    path('', include(router.urls)),
]
