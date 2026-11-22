"""Writing evaluation model - stores essay evaluation results."""
from django.db import models
from accounts.models import User


class WritingEvaluation(models.Model):
    """Model for storing writing evaluation results."""
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='writing_evaluations',
    )
    essay_text = models.TextField()
    grammar_score = models.IntegerField()
    vocabulary_score = models.IntegerField()
    coherence_score = models.IntegerField()
    cefr_level = models.CharField(max_length=2, choices=[
        ('A1', 'A1'), ('A2', 'A2'), ('B1', 'B1'), 
        ('B2', 'B2'), ('C1', 'C1'), ('C2', 'C2'),
    ])
    overall_score = models.IntegerField()
    suggestions = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Writing Evaluation'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.cefr_level} - {self.overall_score}"