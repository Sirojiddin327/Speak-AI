"""Vocabulary tracking model - tracks user vocabulary progress."""
from django.db import models
from accounts.models import User


class VocabularyProgress(models.Model):
    """Model for tracking user vocabulary progress."""
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='vocabulary_progress',
    )
    level = models.CharField(max_length=2, choices=[
        ('A1', 'A1'), ('A2', 'A2'), ('B1', 'B1'), 
        ('B2', 'B2'), ('C1', 'C1'), ('C2', 'C2'),
    ])
    words_learned = models.IntegerField(default=0)
    words_total = models.IntegerField(default=100)  # Expected for this level
    last_practiced = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Vocabulary Progress'
        unique_together = ['user', 'level']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.level} ({self.words_learned}/{self.words_total})"
    
    @property
    def progress_percentage(self):
        """Return vocabulary mastery percentage."""
        if self.words_total > 0:
            return min(100, int((self.words_learned / self.words_total) * 100))
        return 0