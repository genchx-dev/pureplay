from decimal import Decimal, InvalidOperation

from django.contrib.auth import get_user_model
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from apps.matches.services import create_match, join_match
from .queue import accept_open_match, cancel_queue_entry, ensure_queue_entry, list_open_matches


def parse_stake(value):
    try:
        stake = Decimal(str(value or 0))
    except (InvalidOperation, TypeError):
        raise ValueError('Stake must be a valid number')
    if stake < 0:
        raise ValueError('Stake cannot be negative')
    return stake


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def join_queue_view(request):
    game_type = request.data.get('gameType', 'tictactoe')
    mode = request.data.get('mode', 'quick_match')
    if game_type != 'tictactoe' or mode != 'quick_match':
        return Response({'error': 'Unsupported matchmaking request'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        stake = parse_stake(request.data.get('stake'))
    except ValueError as exc:
        return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    match_id = ensure_queue_entry(request.user.id, game_type=game_type, stake=stake)
    if match_id:
        return Response({'status': 'matched', 'matchId': str(match_id)})
    return Response({'status': 'waiting'})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def cancel_queue_view(request):
    cancel_queue_entry(request.user.id)
    return Response({'status': 'cancelled'})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def open_matches_view(request):
    game_type = request.query_params.get('gameType', 'tictactoe')
    if game_type != 'tictactoe':
        return Response({'error': 'Unsupported game type'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        stake = parse_stake(request.query_params.get('stake')) if request.query_params.get('stake') else None
    except ValueError as exc:
        return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    User = get_user_model()
    entries = list_open_matches(request.user.id, game_type=game_type, stake=stake)
    users = {user.id: user for user in User.objects.filter(id__in=[entry['user_id'] for entry in entries])}

    return Response([
        {
            'id': entry['id'],
            'gameType': entry['game_type'],
            'stake': float(entry['stake']),
            'player': {
                'id': str(entry['user_id']),
                'username': users[entry['user_id']].username if entry['user_id'] in users else 'Player',
                'tier': getattr(users[entry['user_id']], 'tier', 'Bronze') if entry['user_id'] in users else 'Bronze',
                'rank': getattr(users[entry['user_id']], 'rank', 1000) if entry['user_id'] in users else 1000,
            },
        }
        for entry in entries
    ])


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def accept_open_match_view(request):
    queue_id = request.data.get('queueId')
    if not queue_id:
        return Response({'error': 'queueId is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        match_id = accept_open_match(queue_id, request.user.id)
    except ValueError as exc:
        return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    return Response({'status': 'matched', 'matchId': str(match_id)})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def available_players_view(request):
    User = get_user_model()
    players = User.objects.exclude(id=request.user.id).order_by('username')[:20]
    preferred_stake = int(request.query_params.get('stake') or 500)
    return Response([
        {
            'id': str(player.id),
            'username': player.username,
            'tier': getattr(player, 'tier', 'Bronze'),
            'rank': getattr(player, 'rank', 1000),
            'preferredStake': preferred_stake,
            'status': 'online',
        }
        for player in players
    ])


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def challenge_player_view(request):
    opponent_id = request.data.get('opponentId')
    game_type = request.data.get('gameType', 'tictactoe')
    if not opponent_id:
        return Response({'error': 'opponentId is required'}, status=status.HTTP_400_BAD_REQUEST)
    if game_type != 'tictactoe':
        return Response({'error': 'Unsupported game type'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        stake = parse_stake(request.data.get('stake'))
    except ValueError as exc:
        return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    User = get_user_model()
    if not User.objects.filter(id=opponent_id).exists():
        return Response({'error': 'Opponent not found'}, status=status.HTTP_404_NOT_FOUND)
    if str(opponent_id) == str(request.user.id):
        return Response({'error': 'You cannot challenge yourself'}, status=status.HTTP_400_BAD_REQUEST)

    match = create_match(request.user.id, game_type=game_type, stake=stake)
    join_match(match.id, opponent_id)
    return Response({'status': 'matched', 'matchId': str(match.id)})
