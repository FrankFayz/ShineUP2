from django.contrib import admin
from django.http import JsonResponse
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static


def backend_status(request):
    return JsonResponse({
        'status': 'successfully connected',
        'message': 'ShineUP backend is running correctly.',
        'api': '/api/',
        'health': '/health/',
    })

urlpatterns = [
    # Backend status
    path('', backend_status, name='backend-status'),

    # Admin
    path('admin/', admin.site.urls),
    
    # Health check
    path('health/', backend_status, name='health-check'),
    
    # API routes
    path('api/', include('videos.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
