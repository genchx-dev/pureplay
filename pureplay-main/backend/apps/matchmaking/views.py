# pureplay-main/backend/apps/matchmaking/views.py

from decimal import Decimal, InvalidOperation

from django.contrib.auth import get_user_model
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from apps.matches.services import create_match, join_match
from .queue import accept_open_match, cancel_queue_entry, ensure_queue_entry, list_open_matches

# NEW imports for challenge system
from .models import Challenge
from .services import ChallengeService
from .serializers import ChallengeSerializer


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
    if game_type not in ['tictactoe', 'chess', 'whot'] or mode != 'quick_match':
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
    if game_type not in ['tictactoe', 'chess', 'whot']:
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
    board_theme = request.data.get('boardTheme', 'random')
    if not opponent_id:
        return Response({'error': 'opponentId is required'}, status=status.HTTP_400_BAD_REQUEST)
    if game_type not in ['tictactoe', 'chess', 'whot']:
        return Response({'error': 'Unsupported game type'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        stake = parse_stake(request.data.get('stake'))
    except ValueError as exc:
        return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    User = get_user_model()
    opponent = User.objects.filter(id=opponent_id).first()
    if not opponent:
        opponent = User.objects.filter(username=opponent_id).first()
    if not opponent:
        return Response({'error': 'Opponent not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if opponent.id == request.user.id:
        return Response({'error': 'You cannot challenge yourself'}, status=status.HTTP_400_BAD_REQUEST)

    from apps.matches.services import create_series
    if (game_type == 'tictactoe' or (stake > 0 and game_type != 'chess')) and game_type != 'whot':
        series, match = create_series(request.user.id, opponent.id, game_type, stake, board_theme=board_theme)
    else:
        match = create_match(request.user.id, game_type=game_type, stake=stake, board_theme=board_theme)
        join_match(match.id, opponent.id)
        
    return Response({'status': 'matched', 'matchId': str(match.id)})


# ========== NEW CHALLENGE SYSTEM VIEWS (pending invite flow) ==========

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def send_challenge(request):
    """Send a pending challenge (invite) to another user."""
    to_user_id = request.data.get('to_user_id')
    stake_amount = request.data.get('stake_amount', 0)
    game_type = request.data.get('game_type', 'tictactoe')
    board_theme = request.data.get('board_theme', 'random')

    if not to_user_id:
        return Response({'error': 'to_user_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    User = get_user_model()
    to_user = User.objects.filter(id=to_user_id).first()
    if not to_user:
        to_user = User.objects.filter(username=to_user_id).first()
    if not to_user:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    try:
        challenge = ChallengeService.send_challenge(
            from_user=request.user,
            to_user=to_user,
            stake_amount=stake_amount,
            game_type=game_type,
            board_theme=board_theme,
        )
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    serializer = ChallengeSerializer(challenge)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def accept_challenge(request, challenge_id):
    """Accept a pending challenge, locks stake, creates match."""
    try:
        result = ChallengeService.accept_challenge(challenge_id, request.user)
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except NotImplementedError as e:
        return Response({'error': str(e)}, status=status.HTTP_501_NOT_IMPLEMENTED)

    return Response({
        'challenge': ChallengeSerializer(result['challenge']).data,
        'match_id': result['match_id'],
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def decline_challenge(request, challenge_id):
    """Decline a pending challenge."""
    try:
        challenge = ChallengeService.decline_challenge(challenge_id, request.user)
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    serializer = ChallengeSerializer(challenge)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def incoming_challenges(request):
    """List pending challenges received by the authenticated user."""
    challenges = Challenge.objects.filter(
        to_user=request.user,
        status='pending'
    ).select_related('from_user', 'to_user')
    serializer = ChallengeSerializer(challenges, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def outgoing_challenges(request):
    """List pending challenges sent by the authenticated user."""
    challenges = Challenge.objects.filter(
        from_user=request.user,
        status='pending'
    ).select_related('from_user', 'to_user')
    serializer = ChallengeSerializer(challenges, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_challenge(request, challenge_id):
    """Get details of a specific challenge (if user is sender or receiver)."""
    try:
        challenge = Challenge.objects.get(id=challenge_id)
    except Challenge.DoesNotExist:
        return Response({'error': 'Challenge not found'}, status=status.HTTP_404_NOT_FOUND)

    if challenge.from_user != request.user and challenge.to_user != request.user:
        return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

    serializer = ChallengeSerializer(challenge)
    return Response(serializer.data)