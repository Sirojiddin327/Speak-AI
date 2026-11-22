"""Speaking views - AI-powered speaking tutor."""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import SpeakingSession
from .serializers import SpeakingSessionSerializer
from ai_engine.services import GeminiService

User = get_user_model()
gemini = GeminiService()


@api_view(['POST'])
@permission_classes([])  # Allow anyone - demo mode fallback
def submit_speaking(request):
    """Submit speaking practice and get AI feedback.
    
    Expected request:
    {
        "userText": "string",
        "topic": "string",
        "level": "A1|A2|B1|B2|C1|C2",
        "history": [{role, content}, ...]
    }
    """
    user_text = request.data.get('userText', '')
    topic = request.data.get('topic', 'daily')
    level = request.data.get('level', 'B1')
    history = request.data.get('history', [])
    
    # Get AI feedback
    result = gemini.generate_speaking_response(user_text, topic, level, history)
    
    # Save session if not demo and user authenticated
    if not result['isDemo']:
        try:
            user = request.user if request.user.is_authenticated else User.objects.get(username='anonymous')
            session = SpeakingSession.objects.create(
                user=user,
                topic=topic,
                level=level,
                score=result['feedback'].get('scoreOutOf100', 0),
                word_count=len(user_text.split()) if user_text else 0,
            )
        except Exception:
            pass  # Session save failure shouldn't break the API
    
    return Response({
        'reply': result['reply'],
        'feedback': result['feedback'],
        'isDemo': result['isDemo'],
    })