# pureplay-main/backend/apps/tournaments/views.py

from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import Tournament
from .serializers import TournamentSerializer, TournamentDetailSerializer
from .services import TournamentService


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def list_tournaments(request):
    tournaments = TournamentService.list_active_tournaments()
    serializer = TournamentSerializer(tournaments, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_tournament(request):
    name = request.data.get('name')
    game_type = request.data.get('game_type', 'tictactoe')
    entry_fee = request.data.get('entry_fee', 0)
    max_players = request.data.get('max_players', 8)
    bracket_type = request.data.get('bracket_type', 'single_elimination')

    if not name:
        return Response(
            {'error': 'name required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        tournament = TournamentService.create_tournament(
            created_by=request.user,
            name=name,
            game_type=game_type,
            entry_fee=entry_fee,
            max_players=max_players,
            bracket_type=bracket_type
        )
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    serializer = TournamentSerializer(tournament)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def join_tournament(request, tournament_id):
    try:
        TournamentService.register_user(tournament_id, request.user)
        return Response({
            'status': 'success',
            'message': 'Registered successfully'
        })
    except Tournament.DoesNotExist:
        return Response({'error': 'Tournament not found'}, status=status.HTTP_404_NOT_FOUND)
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def tournament_detail(request, tournament_id):
    try:
        tournament = Tournament.objects.get(id=tournament_id)
    except Tournament.DoesNotExist:
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    serializer = TournamentDetailSerializer(tournament)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def tournament_bracket(request, tournament_id):
    try:
        bracket = TournamentService.get_bracket(tournament_id)
    except Tournament.DoesNotExist:
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    return Response(bracket)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def start_match(request, match_id):
    try:
        match = TournamentService.start_match(match_id)
        return Response({'match_id': str(match.id)})
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ✅ UPDATED: Swiss/score-aware match reporting
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def report_match_result(request, match_id):
    winner_participant_id = request.data.get('winner_participant_id')
    player1_score = request.data.get('player1_score', 0)
    player2_score = request.data.get('player2_score', 0)

    if not winner_participant_id:
        return Response(
            {'error': 'winner_participant_id required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        TournamentService.report_match_result(
            match_id=match_id,
            winner_participant_id=winner_participant_id,
            player1_score=player1_score,
            player2_score=player2_score
        )
        return Response({'status': 'success'})
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)