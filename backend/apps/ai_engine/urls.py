"""AI Engine URL Patterns."""
from django.urls import path
from . import views

urlpatterns = [
    # Health check
    path('health/', views.health_check, name='health'),
    # Speaking endpoint
    path('speaking/', views.speaking, name='speaking'),
    # Writing evaluation endpoint
    path('writing/', views.writing, name='writing'),
    # CEFR feedback endpoint
    path('cefr/', views.cefr, name='cefr'),
]