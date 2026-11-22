"""Writing evaluation views - AI-powered essay evaluation."""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import WritingEvaluation
from .serializers import WritingEvaluationSerializer
from ai_engine.services import GeminiService

User = get_user_model()
gemini = GeminiService()


@api_view(['POST'])
@permission_classes([])
def submit_writing(request):
    """Submit essay for AI evaluation.
    
    Expected request:
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
    
    # Get AI feedback
    result = gemini.generate_writing_feedback(essay)
    
    # Save evaluation if not demo
    if not result['isDemo']:
        try:
            user = request.user if request.user.is_authenticated else User.objects.get(username='anonymous')
            eval_obj = WritingEvaluation.objects.create(
                user=user,
                essay_text=essay,
                grammar_score=result['feedback']['grammar']['score'],
                vocabulary_score=result['feedback']['vocabulary']['score'],
                coherence_score=result['feedback']['coherence']['score'],
                cefr_level=result['feedback']['cefrLevel'],
                overall_score=result['feedback']['overallScore'],
                suggestions=result['feedback']['suggestions'],
            )
        except Exception:
            pass  # Save failure shouldn't break API
    
    return Response({
        'feedback': result['feedback'],
        'isDemo': result['isDemo'],
    })