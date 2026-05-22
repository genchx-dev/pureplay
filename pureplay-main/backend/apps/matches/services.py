from datetime import datetime, timedelta

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

TURN_SECONDS = 10
WIN_LINES = (
    (0, 1, 2),
    (3, 4, 5),
    (6, 7, 8),
    (0, 3, 6),
    (1, 4, 7),
    (2, 5, 8),
    (0, 4, 8),
    (2, 4, 6),
)

def get_match_model():
    from .models import Match
    return Match

def iso(dt):
    return dt.isoformat().replace('+00:00', 'Z')


def turn_deadline():
    return timezone.now() + timedelta(seconds=TURN_SECONDS)


def create_match(player1_id, game_type='tictactoe', stake=0):
    Match = get_match_model()
    User = get_user_model()
    player1 = User.objects.get(id=player1_id)
    match = Match.objects.create(
        player1=player1,
        status='waiting',
        game_state={
            'board': [None] * 9,
            'currentPlayer': 'X',
            'players': {'X': player1.id},
            'turnEndsAt': None,
            'stake': str(stake),
            'gameType': game_type,
        },
    )
    return match

def join_match(match_id, player2_id):
    Match = get_match_model()
    User = get_user_model()
    with transaction.atomic():
        match = Match.objects.select_for_update().get(id=match_id)
        if match.status != 'waiting':
            raise ValueError('Match not available')
        if match.player1_id == player2_id:
            raise ValueError('Cannot join your own match')

        player2 = User.objects.get(id=player2_id)
        deadline = turn_deadline()
        match.player2 = player2
        match.status = 'active'
        match.current_turn = match.player1
        match.game_state = {
            **(match.game_state or {}),
            'board': (match.game_state or {}).get('board') or [None] * 9,
            'currentPlayer': 'X',
            'players': {'X': match.player1_id, 'O': player2.id},
            'turnEndsAt': iso(deadline),
        }
        match.save(update_fields=['player2', 'status', 'current_turn', 'game_state', 'updated_at'])
        return match


def player_symbol(match, user_id):
    players = (match.game_state or {}).get('players') or {}
    for symbol, player_id in players.items():
        if str(player_id) == str(user_id):
            return symbol
    return None


def check_winner(board):
    for a, b, c in WIN_LINES:
        if board[a] and board[a] == board[b] == board[c]:
            return board[a]
    if all(cell is not None for cell in board):
        return 'draw'
    return None


def make_move(match_id, player_id, position):
    Match = get_match_model()
    if not isinstance(position, int) or position < 0 or position > 8:
        raise ValueError('Invalid move')

    with transaction.atomic():
        match = Match.objects.select_for_update().select_related('player1', 'player2').get(id=match_id)
        if match.status != 'active':
            raise ValueError('Match not active')

        symbol = player_symbol(match, player_id)
        if not symbol:
            raise ValueError('You are not a player in this match')

        state = match.game_state or {}
        board = list(state.get('board') or [None] * 9)
        if state.get('currentPlayer') != symbol:
            raise ValueError('Not your turn')
        if board[position] is not None:
            raise ValueError('Cell already taken')

        board[position] = symbol
        result = check_winner(board)
        if result:
            state['board'] = board
            state['turnEndsAt'] = None
            if result == 'draw':
                state['winner'] = 'draw'
            else:
                state['winner'] = result
                match.winner_id = state.get('players', {}).get(result)
            match.status = 'completed'
            match.game_state = state
            match.save(update_fields=['winner', 'status', 'game_state', 'updated_at'])
            return match, 'GAME_OVER'

        next_player = 'O' if symbol == 'X' else 'X'
        state['board'] = board
        state['currentPlayer'] = next_player
        state['turnEndsAt'] = iso(turn_deadline())
        match.current_turn_id = state.get('players', {}).get(next_player)
        match.game_state = state
        match.save(update_fields=['current_turn', 'game_state', 'updated_at'])
        return match, 'MOVE_MADE'


def skip_expired_turn(match_id):
    Match = get_match_model()
    with transaction.atomic():
        match = Match.objects.select_for_update().get(id=match_id)
        if match.status != 'active':
            return None

        state = match.game_state or {}
        turn_ends_at = state.get('turnEndsAt')
        if not turn_ends_at:
            return None

        deadline = datetime.fromisoformat(turn_ends_at.replace('Z', '+00:00'))
        if timezone.now() < deadline:
            return None

        skipped_player = state.get('currentPlayer', 'X')
        next_player = 'O' if skipped_player == 'X' else 'X'
        state['currentPlayer'] = next_player
        state['turnEndsAt'] = iso(turn_deadline())
        match.current_turn_id = state.get('players', {}).get(next_player)
        match.game_state = state
        match.save(update_fields=['current_turn', 'game_state', 'updated_at'])
        return match, skipped_player
