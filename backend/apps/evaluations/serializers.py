"""Serializers for evaluations app."""
from rest_framework import serializers
from .models import WritingEvaluation


class WritingEvaluationSerializer(serializers.ModelSerializer):
    """Serializer for writing evaluation."""
    
    class Meta:
        model = WritingEvaluation
        fields = [
            'id', 'user', 'essay_text', 'grammar_score', 
            'vocabulary_score', 'coherence_score', 'cefr_level',
            'overall_score', 'suggestions', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'created_at']