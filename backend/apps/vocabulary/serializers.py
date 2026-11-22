"""Serializers for vocabulary app."""
from rest_framework import serializers
from .models import VocabularyProgress


class VocabularyProgressSerializer(serializers.ModelSerializer):
    """Serializer for vocabulary progress."""
    
    class Meta:
        model = VocabularyProgress
        fields = ['id', 'user', 'level', 'words_learned', 'words_total', 'progress_percentage', 'last_practiced', 'created_at']
        read_only_fields = ['id', 'user', 'created_at', 'last_practiced']