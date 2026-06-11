from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
import os
from django.http import HttpResponse
from django.views.static import serve
from django.contrib.staticfiles.views import serve as staticfiles_serve
from django.views.decorators.cache import never_cache

FRONTEND_DIST = os.path.normpath(os.path.join(settings.BASE_DIR, '..', 'frontend', 'dist'))
FRONTEND_ASSETS = os.path.join(FRONTEND_DIST, 'assets')


def serve_static_files(request, path):
    return staticfiles_serve(request, path, insecure=True)


def serve_react(request):
    dist_index = os.path.join(FRONTEND_DIST, 'index.html')
    if not os.path.exists(dist_index):
        dist_index = os.path.join(settings.STATIC_ROOT, 'index.html')

    if os.path.exists(dist_index):
        with open(dist_index, 'r', encoding='utf-8') as f:
            return HttpResponse(f.read(), content_type='text/html')
    return HttpResponse("React production build index.html not found. Please build frontend first.", status=404)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('api/dashboard/', include('core.urls')),
    path('api/core/', include('core.urls')),
    path('api/venues/', include('venues.urls')),
    path('api/bookings/', include('bookings.urls')),
    path('api/customers/', include('customers.urls')),
    path('api/finance/', include('finance.urls')),
    path('api/inventory/', include('inventory.urls')),
    path('api/decorations/', include('decorations.urls')),
    path('api/guesthouse/', include('guesthouse.urls')),
    path('api/landing/', include('landing.urls')),
]

# Static frontend build + uploads must be registered BEFORE the SPA catch-all.
urlpatterns += [
    re_path(
        r'^static/(?P<path>.*)$',
        never_cache(serve_static_files),
    ),
    re_path(
        r'^assets/(?P<path>.*)$',
        serve,
        {'document_root': FRONTEND_ASSETS},
    ),
    re_path(
        r'^(?P<path>favicon\.svg|hero\.png|icons\.svg)$',
        serve,
        {'document_root': FRONTEND_DIST},
    ),
    re_path(
        r'^media/(?P<path>.*)$',
        serve,
        {'document_root': settings.MEDIA_ROOT},
    ),
    re_path(r'^.*$', serve_react, name='react-app'),
]

