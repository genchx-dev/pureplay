from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .services import RankingService
from apps.matches.models import Match
from django.db import models

User = get_user_model()

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def leaderboard(request):
    game_type = request.query_params.get('game_type', 'tictactoe')
    sort_by = request.query_params.get('sort_by', 'mmr')
    limit = int(request.query_params.get('limit', 50))
    data = RankingService.get_leaderboard(game_type, sort_by, limit)
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_stats(request):
    game_type = request.query_params.get('game_type', 'tictactoe')
    stats = RankingService.get_or_create_stats(request.user, game_type)
    return Response({
        'username': request.user.username,
        'wins': stats.wins,
        'losses': stats.losses,
        'draws': stats.draws,
        'total_matches': stats.total_matches,
        'xp': stats.xp,
        'rank_tier': stats.rank_tier,
        'next_tier_xp': stats.next_tier_xp,
        'mmr': stats.mmr,
        'current_streak': stats.current_streak,
        'longest_streak': stats.longest_streak,
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def match_history(request):
    matches = Match.objects.filter(
        models.Q(player1=request.user) | models.Q(player2=request.user)
    ).order_by('-created_at')[:20]
    result = []
    for match in matches:
        opponent = match.player1 if match.player2 == request.user else match.player2
        result.append({
            'id': match.id,
            'opponent': opponent.username if opponent else 'Unknown',
            'result': 'win' if match.winner == request.user else ('loss' if match.winner else 'draw'),
            'stake': float(match.game_state.get('stake', 0)),
            'created_at': match.created_at.isoformat(),
        })
    return Response(result)