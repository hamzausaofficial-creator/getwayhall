from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
import os
from django.http import HttpResponse

def serve_react(request):
    dist_index = os.path.join(settings.BASE_DIR, '..', 'frontend', 'dist', 'index.html')
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
    
    # Catch-all SPA router for React frontend
    re_path(r'^.*$', serve_react, name='react-app'),
]

# Support media files serving in both dev and packaged production
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

