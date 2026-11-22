"""Config URL Configuration."""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    # API v1 routes
    path('api/v1/', include('core.api_router')),
    # Legacy AI endpoints (for frontend compatibility)
    path('api/ai/', include('ai_engine.urls')),
]