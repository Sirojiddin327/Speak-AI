"""Speaking session model - tracks user progress."""
from django.db import models
from accounts.models import User


class SpeakingSession(models.Model):
    """Model for tracking speaking practice sessions."""
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='speaking_sessions',
    )
    topic = models.CharField(max_length=100, default='daily')
    level = models.CharField(max_length=2, choices=[
        ('A1', 'A1'), ('A2', 'A2'), ('B1', 'B1'), 
        ('B2', 'B2'), ('C1', 'C1'), ('C2', 'C2'),
    ])
    score = models.IntegerField(default=0)
    word_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Speaking Session'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.topic} ({self.score})"