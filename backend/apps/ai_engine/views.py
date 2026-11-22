"""AI Engine Views - Gemini AI endpoints."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from .services import GeminiService

gemini_service = GeminiService()


@api_view(['GET'])
def health_check(request):
    """Check AI service health and Gemini configuration."""
    configured = gemini_service.is_configured()
    return Response({
        'status': 'ok',
        'geminiConfigured': configured,
        'provider': 'gemini' if configured else None,
    })


@api_view(['POST'])
def speaking(request):
    """Speaking tutor endpoint.
    
    Expected request body:
    {
        "userText": "string",
        "topic": "string",
        "level": "A1|A2|B1|B2|C1|C2",
        "history": []  // array of {role, content} objects
    }
    
    Returns:
    {
        "reply": "string",
        "feedback": {
            "grammar": "string",
            "vocabulary": "string",
            "fluency": "string",
            "scoreOutOf100": number
        },
        "isDemo": boolean
    }
    """
    user_text = request.data.get('userText', '')
    topic = request.data.get('topic', 'daily')
    level = request.data.get('level', 'B1')
    history = request.data.get('history', [])
    
    result = gemini_service.generate_speaking_response(user_text, topic, level, history)
    
    return Response({
        'reply': result['reply'],
        'feedback': result['feedback'],
        'isDemo': result['isDemo'],
    })


@api_view(['POST'])
def writing(request):
    """Writing evaluation endpoint.
    
    Expected request body:
    {
        "essay": "string"
    }
    
    Returns:
    {
        "feedback": {
            "grammar": {"score": int, "notes": [string]},
            "vocabulary": {"score": int, "notes": [string]},
            "coherence": {"score": int, "notes": [string]},
            "cefrLevel": "A1|A2|B1|B2|C1|C2",
            "suggestions": [string],
            "overallScore": int
        },
        "isDemo": boolean
    }
    """
    essay = request.data.get('essay', '')
    
    result = gemini_service.generate_writing_feedback(essay)
    
    return Response({
        'feedback': result['feedback'],
        'isDemo': result['isDemo'],
    })


@api_view(['POST'])
def cefr(request):
    """CEFR practice feedback endpoint.
    
    Expected request body:
    {
        "answers": [int|null, ...]  // array of selected option indices or null
    }
    
    Returns:
    {
        "estimatedLevel": "A1|A2|B1|B2|C1|C2",
        "score": int,  // number of correct answers
        "total": int,  // total number of questions
        "perLevel": {
            "A1": {"correct": int, "total": int},
            "A2": {"correct": int, "total": int},
            "B1": {"correct": int, "total": int},
            "B2": {"correct": int, "total": int},
            "C1": {"correct": int, "total": int},
            "C2": {"correct": int, "total": int}
        },
        "isDemo": boolean
    }
    """
    answers = request.data.get('answers', [])
    
    result = gemini_service.generate_cefr_feedback(answers)
    
    return Response({
        'estimatedLevel': result['estimatedLevel'],
        'score': result['score'],
        'total': result['total'],
        'perLevel': result['perLevel'],
        'isDemo': result['isDemo'],
    })