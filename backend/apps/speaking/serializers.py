"""Serializers for speaking app."""
from rest_framework import serializers
from .models import SpeakingSession


class SpeakingSessionSerializer(serializers.ModelSerializer):
    """Serializer for speaking session."""
    
    class Meta:
        model = SpeakingSession
        fields = ['id', 'topic', 'level', 'score', 'word_count', 'created_at']
        read_only_fields = ['id', 'created_at']