from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Tournament
from .serializers import TournamentSerializer
from .services import TournamentService

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def list_tournaments(request):
    tournaments = TournamentService.list_active_tournaments()
    serializer = TournamentSerializer(tournaments, many=True, context={'request': request})
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def join_tournament(request, tournament_id):
    try:
        TournamentService.register_user(tournament_id, request.user)
        return Response({'status': 'success', 'message': 'Registered successfully'})
    except Tournament.DoesNotExist:
        return Response({'error': 'Tournament not found'}, status=status.HTTP_404_NOT_FOUND)
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
