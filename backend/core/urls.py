"""Core API URL routing."""
from django.urls import path, include

urlpatterns = [
    # Authentication endpoints
    path('auth/', include('accounts.urls')),
    # AI Engine endpoints
    path('ai/', include('ai_engine.urls')),
    # Speaking endpoints
    path('speaking/', include('speaking.urls')),
    # Writing evaluation endpoints
    path('evaluations/', include('evaluations.urls')),
    # Vocabulary endpoints
    path('vocabulary/', include('vocabulary.urls')),
]