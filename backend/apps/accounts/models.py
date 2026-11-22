"""Custom User model for SpeakAI."""
from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    """Custom User model with CEFR level and daily goal."""
    
    CEFR_CHOICES = [
        ('A1', 'A1 - Beginner'),
        ('A2', 'A2 - Elementary'),
        ('B1', 'B1 - Intermediate'),
        ('B2', 'B2 - Upper Intermediate'),
        ('C1', 'C1 - Advanced'),
        ('C2', 'C2 - Proficient'),
    ]
    
    cefr_level = models.CharField(
        max_length=2,
        choices=CEFR_CHOICES,
        default='A1',
        verbose_name='CEFR Level'
    )
    daily_goal_minutes = models.IntegerField(
        default=20,
        verbose_name='Daily Goal (minutes)'
    )
    # Remove the groups and user_permissions fields since we're using JWT
    # and role-based access through JWT claims
    
    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return self.username
    
    @property
    def full_name(self):
        """Return the user's full name."""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.username