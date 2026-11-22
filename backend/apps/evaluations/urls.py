"""Evaluations URL Patterns."""
from django.urls import path
from . import views

urlpatterns = [
    path('submit/', views.submit_writing, name='submit_writing'),
]