from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .services import create_match, join_match
from .models import Match
from .serializers import MatchSerializer

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_match_view(request):
    match = create_match(
        request.user.id,
        game_type=request.data.get('gameType', 'tictactoe'),
        stake=request.data.get('stake', 0),
    )
    return Response({'matchId': str(match.id), 'status': match.status})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_match_view(request, match_id):
    try:
        match = join_match(match_id, request.user.id)
        return Response(MatchSerializer(match).data)
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_match_view(request, match_id):
    try:
        match = Match.objects.get(id=match_id)
    except Match.DoesNotExist:
        return Response({'error': 'Match not found'}, status=status.HTTP_404_NOT_FOUND)
    if request.user.id not in (match.player1_id, match.player2_id):
        return Response({'error': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)
    serializer = MatchSerializer(match)
    return Response(serializer.data)
