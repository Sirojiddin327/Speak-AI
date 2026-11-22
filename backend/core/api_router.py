"""Core API Router - central API entry point."""
from django.urls import path, include

urlpatterns = [
    # Authentication (JWT)
    path('auth/', include('accounts.urls')),
    # AI Engine (Gemini)
    path('ai/', include('ai_engine.urls')),
    # Speaking
    path('speaking/', include('speaking.urls')),
    # Writing Evaluations
    path('evaluations/', include('evaluations.urls')),
    # Vocabulary
    path('vocabulary/', include('vocabulary.urls')),
]