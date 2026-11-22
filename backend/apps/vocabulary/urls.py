"""Vocabulary URL Patterns."""
from django.urls import path
from . import views

urlpatterns = [
    path('progress/<str:level>/', views.progress, name='vocabulary_progress'),
    path('update/', views.update_progress, name='vocabulary_update'),
]