"""Vocabulary views - progress tracking."""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.contrib.auth import get_user_model
from .models import VocabularyProgress
from .serializers import VocabularyProgressSerializer

User = get_user_model()


@api_view(['GET'])
@permission_classes([])
def progress(request, level):
    """Get vocabulary progress for a specific CEFR level."""
    try:
        progress_obj, created = VocabularyProgress.objects.get_or_create(
            user=request.user if request.user.is_authenticated else User.objects.get(username='anonymous'),
            level=level,
        )
        serializer = VocabularyProgressSerializer(progress_obj)
        return Response(serializer.data)
    except User.DoesNotExist:
        return Response(
            {'error': 'User not authenticated'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([])
def update_progress(request):
    """Update vocabulary progress."""
    level = request.data.get('level', 'A1')
    words_learned = request.data.get('words_learned', 0)
    
    try:
        progress_obj, created = VocabularyProgress.objects.get_or_create(
            user=request.user if request.user.is_authenticated else User.objects.get(username='anonymous'),
            level=level,
        )
        progress_obj.words_learned = max(progress_obj.words_learned, words_learned)
        progress_obj.last_practiced = timezone.now()
        progress_obj.save()
        
        serializer = VocabularyProgressSerializer(progress_obj)
        return Response(serializer.data)
    except User.DoesNotExist:
        return Response(
            {'error': 'User not authenticated'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )