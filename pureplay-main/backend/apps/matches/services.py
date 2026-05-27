# pureplay-main/backend/apps/matches/services.py

from datetime import datetime, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

from apps.wallet.services import WalletService
from apps.rankings.services import RankingService
from apps.games.registry import get_engine
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

def get_match_model():
    from .models import Match
    return Match


def get_series_model():
    from .models import Series
    return Series


def iso(dt):
    return dt.isoformat().replace('+00:00', 'Z')


def turn_deadline(seconds):
    return timezone.now() + timedelta(seconds=seconds)


def player_symbol(match, user_id):
    players = (match.game_state or {}).get('players') or {}
    for symbol, player_id in players.items():
        if str(player_id) == str(user_id):
            return symbol
    return None


# =========================
# SERIES CREATION
# =========================

def create_series(player1_id, player2_id, game_type='tictactoe', stake=0):
    Series = get_series_model()
    User = get_user_model()
    player1 = User.objects.get(id=player1_id)
    player2 = User.objects.get(id=player2_id)
    series = Series.objects.create(
        player1=player1,
        player2=player2,
        stake=Decimal(str(stake)),
        game_type=game_type
    )
    match = create_match(player1_id, game_type, stake=stake, series=series, game_number=1)
    join_match(match.id, player2_id)
    return series, match


# =========================
# MATCH CREATION
# =========================

def create_match(player1_id, game_type='tictactoe', stake=0, series=None, game_number=1, board_theme='random'):
    import random
    Match = get_match_model()
    User = get_user_model()
    player1 = User.objects.get(id=player1_id)
    stake_decimal = Decimal(str(stake))

    engine = get_engine(game_type)
    initial_state = engine.get_initial_state(str(player1_id), '', stake=stake_decimal)
    initial_state['turnEndsAt'] = None
    
    # Resolve board theme
    theme = board_theme
    if theme == 'random':
        theme = random.choice(['lichess', 'chesscom', 'midnight', 'blue'])
    initial_state['boardTheme'] = theme
    
    # Inject customizations
    initial_state['customStyles'] = {
        'player1': player1.chess_customizations or {},
        'player2': {}
    }

    if series:
        initial_state['currentRound'] = game_number
        initial_state['roundScores'] = {
            'X': series.player1_wins,
            'O': series.player2_wins
        }

    with transaction.atomic():
        match = Match.objects.create(
            player1=player1,
            status='waiting',
            game_state=initial_state,
            series=series,
            game_number=game_number,
        )
        if stake_decimal > 0:
            WalletService.lock_stake(player1, stake_decimal, match.id)
    return match


def create_series(player1_id, player2_id, game_type='tictactoe', stake=0, board_theme='random'):
    import random
    from .models import Series, Match
    User = get_user_model()
    player1 = User.objects.get(id=player1_id)
    player2 = User.objects.get(id=player2_id)
    stake_decimal = Decimal(str(stake))

    engine = get_engine(game_type)
    
    with transaction.atomic():
        series = Series.objects.create(
            player1=player1,
            player2=player2,
            stake=stake_decimal,
            game_type=game_type,
            status='active'
        )

        if stake_decimal > 0:
            WalletService.lock_funds(player2, stake_decimal)

        initial_state = engine.get_initial_state(str(player1_id), str(player2_id), stake=stake_decimal)
        initial_state['currentRound'] = 1
        initial_state['roundScores'] = {'X': 0, 'O': 0}
        initial_state['roundWinner'] = None
        initial_state['turnEndsAt'] = iso(turn_deadline(engine.turn_seconds))
        
        # Resolve board theme
        theme = board_theme
        if theme == 'random':
            theme = random.choice(['lichess', 'chesscom', 'midnight', 'blue'])
        initial_state['boardTheme'] = theme
        
        # Inject customizations
        initial_state['customStyles'] = {
            'player1': player1.chess_customizations or {},
            'player2': player2.chess_customizations or {}
        }

        match = Match.objects.create(
            player1=player1,
            player2=player2,
            status='active',
            game_state=initial_state,
            current_turn=player1,
            series=series,
            game_number=1
        )

    return series, match


# =========================
# JOIN MATCH (broadcasts MATCH_START when active)
# =========================

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
        stake = Decimal(match.game_state.get('stake', '0'))

        if stake > 0:
            WalletService.lock_stake(player2, stake, match.id)

        game_type = match.game_state.get('gameType', 'tictactoe')
        engine = get_engine(game_type)

        state = match.game_state
        players = state.get('players', {})
        existing_symbols = set(players.keys())
        if len(existing_symbols) == 1:
            first_symbol = next(iter(existing_symbols))
            second_symbol = engine.get_opponent_symbol(first_symbol)
            players[second_symbol] = str(player2.id)
        else:
            raise ValueError("Match already has two players")

        state['players'] = players
        deadline = turn_deadline(engine.turn_seconds)
        state['turnEndsAt'] = iso(deadline)
        
        # Inject customizations now that Player 2 has joined
        state['customStyles'] = {
            'player1': match.player1.chess_customizations or {},
            'player2': player2.chess_customizations or {}
        }

        match.player2 = player2
        match.status = 'active'
        match.current_turn = match.player1
        match.game_state = state
        match.save(update_fields=['player2', 'status', 'current_turn', 'game_state', 'updated_at'])

        # Broadcast MATCH_START to all connected clients in this match room
        channel_layer = get_channel_layer()
        series_info = None
        if match.series:
            series_info = {
                'id': str(match.series.id),
                'player1_wins': match.series.player1_wins,
                'player2_wins': match.series.player2_wins,
                'is_complete': match.series.is_complete(),
            }

        async_to_sync(channel_layer.group_send)(
            f"match_{match.id}",
            {
                'type': 'broadcast_match_start',
                'matchId': str(match.id),
                'board': match.game_state['board'],
                'currentPlayer': match.game_state['currentPlayer'],
                'turnEndsAt': match.game_state['turnEndsAt'],
                'player1_username': match.player1.username,
                'player2_username': match.player2.username,
                'series': series_info,
            }
        )

        return match


# =========================
# MOVE + AUTO SETTLEMENT (with series handling)
# =========================

def make_move(match_id, player_id, move):
    Match = get_match_model()

    with transaction.atomic():
        match = Match.objects.select_for_update().select_related('player1', 'player2', 'series').get(id=match_id)

        if match.status != 'active':
            raise ValueError('Match not active')

        symbol = player_symbol(match, player_id)
        if not symbol:
            raise ValueError('You are not a player in this match')

        state = match.game_state.copy()
        game_type = state.get('gameType', 'tictactoe')
        engine = get_engine(game_type)

        valid, error = engine.validate_move(state, symbol, move)
        if not valid:
            raise ValueError(error)

        new_state = engine.apply_move(state, symbol, move)
        is_over, winner_symbol, _ = engine.check_game_over(new_state)

        stake = Decimal(state.get('stake', '0'))

        # =========================
        # GAME OVER
        # =========================
        if is_over:
            new_state['turnEndsAt'] = None
            series = match.series

            if winner_symbol == 'draw':
                new_state['winner'] = 'draw'
                if stake > 0 and not series:
                    WalletService.refund_match_stakes(
                        match.player1,
                        match.player2,
                        stake,
                        match.id,
                        reason="Match Draw"
                    )
                RankingService.update_after_match(match.id, None, None, is_draw=True)
                
                if series:
                    next_game_number = match.game_number + 1
                    prev_theme = match.game_state.get('boardTheme', 'random')
                    new_match = create_match(
                        match.player1.id,
                        game_type,
                        stake=0,
                        series=series,
                        game_number=next_game_number,
                        board_theme=prev_theme
                    )
                    join_match(new_match.id, match.player2.id)
                    
                    # Broadcast to OLD match room about the NEXT match
                    channel_layer = get_channel_layer()
                    async_to_sync(channel_layer.group_send)(
                        f"match_{match.id}",
                        {
                            'type': 'next_match_event',
                            'matchId': str(new_match.id)
                        }

                    )

            else:
                new_state['winner'] = winner_symbol
                winner_id = new_state.get('players', {}).get(winner_symbol)
                match.winner_id = winner_id
                winner_user = match.player1 if str(match.player1_id) == str(winner_id) else match.player2
                loser_user = match.player2 if winner_user == match.player1 else match.player1

                RankingService.update_after_match(match.id, winner_user, loser_user)

                if series:
                    if winner_user == series.player1:
                        series.player1_wins += 1
                    else:
                        series.player2_wins += 1
                    series.save()

                    if series.is_complete():
                        series_winner = series.get_winner()
                        if series.stake > 0:
                            WalletService.settle_match(
                                winner=series_winner,
                                loser=series.player2 if series_winner == series.player1 else series.player1,
                                stake_amount=series.stake,
                                match_id=str(series.id)
                            )
                        series.status = 'completed'
                        series.winner = series_winner
                        series.save()
                    else:
                        next_game_number = match.game_number + 1
                        prev_theme = match.game_state.get('boardTheme', 'random')
                        new_match = create_match(
                            match.player1.id,
                            game_type,
                            stake=0,
                            series=series,
                            game_number=next_game_number,
                            board_theme=prev_theme
                        )
                        join_match(new_match.id, match.player2.id)

                        # Broadcast to OLD match room about the NEXT match
                        channel_layer = get_channel_layer()
                        async_to_sync(channel_layer.group_send)(
                            f"match_{match.id}",
                            {
                                'type': 'next_match_event',
                                'matchId': str(new_match.id)
                            }
                        )
                else:
                    if stake > 0:
                        WalletService.settle_match(
                            winner=winner_user,
                            loser=loser_user,
                            stake_amount=stake,
                            match_id=match.id
                        )

            match.status = 'completed'
            match.game_state = new_state
            match.save(update_fields=['winner_id', 'status', 'game_state', 'updated_at'])
            return match, 'GAME_OVER'

        # =========================
        # CONTINUE GAME
        # =========================
        new_state['turnEndsAt'] = iso(turn_deadline(engine.turn_seconds))
        current_player_symbol = engine.get_current_player(new_state)
        if current_player_symbol == 'X':
            match.current_turn = match.player1
        else:
            match.current_turn = match.player2

        match.game_state = new_state
        match.save(update_fields=['current_turn', 'game_state', 'updated_at'])
        return match, 'MOVE_MADE'


# =========================
# TURN EXPIRY
# =========================

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
        if timezone.now() < deadline + timedelta(seconds=5):
            return None
        engine = get_engine(state.get('gameType', 'tictactoe'))
        current = engine.get_current_player(state)
        state = engine.skip_turn(state)
        state['turnEndsAt'] = iso(turn_deadline(engine.turn_seconds))
        next_player = state['currentPlayer']
        if next_player == 'X':
            match.current_turn = match.player1
        else:
            match.current_turn = match.player2
        match.game_state = state
        match.save(update_fields=['current_turn', 'game_state', 'updated_at'])
        return match, current
