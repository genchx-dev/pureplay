from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .queue import join_queue, check_queue

User = get_user_model()

@api_view(['POST'])
@permission_classes([AllowAny])
def join_queue_view(request):
    # If user is authenticated, use that; otherwise use the first user (for testing)
    if request.user.is_authenticated:
        user_id = request.user.id
    else:
        user = User.objects.first()
        if not user:
            return Response({'error': 'No users exist'}, status=500)
        user_id = user.id
    match_id, waiting = join_queue(user_id)
    if match_id:
        return Response({'match_id': match_id, 'waiting': False})
    return Response({'match_id': None, 'waiting': True, 'queue_position': 1})

@api_view(['GET'])
@permission_classes([AllowAny])
def available_players_view(request):
    if request.user.is_authenticated:
        user_id = request.user.id
    else:
        user = User.objects.first()
        if not user:
            return Response({'error': 'No users exist'}, status=500)
        user_id = user.id
    match_id, waiting, position = check_queue(user_id)
    if match_id:
        return Response({'match_id': match_id, 'waiting': False})
    return Response({'match_id': None, 'waiting': waiting, 'queue_position': position})