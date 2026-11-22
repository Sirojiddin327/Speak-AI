"""Speaking URL Patterns."""
from django.urls import path
from . import views

urlpatterns = [
    path('submit/', views.submit_speaking, name='submit_speaking'),
]