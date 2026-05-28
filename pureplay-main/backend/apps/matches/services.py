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

        trigger_bot_move_async(match)

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

        trigger_bot_move_async(match)

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
                    
                    # Propagate tournament flags if present in the previous match
                    is_tournament = match.game_state.get('isTournament', False)
                    tournament_id = match.game_state.get('tournamentId')
                    tournament_round = match.game_state.get('tournamentRoundNumber')
                    is_tournament_final = match.game_state.get('isTournamentFinal')
                    if is_tournament:
                        new_match.game_state['isTournament'] = is_tournament
                        if tournament_id:
                            new_match.game_state['tournamentId'] = tournament_id
                        if tournament_round is not None:
                            new_match.game_state['tournamentRoundNumber'] = tournament_round
                        if is_tournament_final is not None:
                            new_match.game_state['isTournamentFinal'] = is_tournament_final
                        new_match.save(update_fields=['game_state'])
                        
                        try:
                            from apps.tournaments.models import TournamentMatch
                            from django.core.cache import cache
                            tmatch = TournamentMatch.objects.filter(match_id=str(match.id)).first()
                            if tmatch:
                                tmatch.match_id = str(new_match.id)
                                tmatch.save(update_fields=['match_id'])
                                cache.delete(f'tournament_bracket_{tmatch.tournament.id}')
                        except Exception as e:
                            pass
                        
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

                        # Auto-report tournament series completion hook
                        try:
                            from apps.tournaments.models import TournamentMatch
                            from apps.tournaments.services import TournamentService
                            match_ids = [str(m.id) for m in series.matches.all()]
                            tmatch = TournamentMatch.objects.filter(match_id__in=match_ids).first()
                            if tmatch:
                                winner_participant = tmatch.tournament.participants.get(user=series_winner)
                                TournamentService.report_match_result(
                                    tournament_match_id=tmatch.id,
                                    winner_participant_id=winner_participant.id,
                                    player1_score=series.player1_wins,
                                    player2_score=series.player2_wins
                                )
                        except Exception as e:
                            pass
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
                        
                        # Propagate tournament flags if present in the previous match
                        is_tournament = match.game_state.get('isTournament', False)
                        tournament_id = match.game_state.get('tournamentId')
                        tournament_round = match.game_state.get('tournamentRoundNumber')
                        is_tournament_final = match.game_state.get('isTournamentFinal')
                        if is_tournament:
                            new_match.game_state['isTournament'] = is_tournament
                            if tournament_id:
                                new_match.game_state['tournamentId'] = tournament_id
                            if tournament_round is not None:
                                new_match.game_state['tournamentRoundNumber'] = tournament_round
                            if is_tournament_final is not None:
                                new_match.game_state['isTournamentFinal'] = is_tournament_final
                            new_match.save(update_fields=['game_state'])
                            
                            try:
                                from apps.tournaments.models import TournamentMatch
                                from django.core.cache import cache
                                tmatch = TournamentMatch.objects.filter(match_id=str(match.id)).first()
                                if tmatch:
                                    tmatch.match_id = str(new_match.id)
                                    tmatch.save(update_fields=['match_id'])
                                    cache.delete(f'tournament_bracket_{tmatch.tournament.id}')
                            except Exception as e:
                                pass
                            
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

                    # Auto-report tournament single match completion hook
                    try:
                        from apps.tournaments.models import TournamentMatch
                        from apps.tournaments.services import TournamentService
                        tmatch = TournamentMatch.objects.filter(match_id=str(match.id)).first()
                        if tmatch:
                            winner_participant = tmatch.tournament.participants.get(user=winner_user)
                            p1_score = 1 if winner_user == tmatch.player1.user else 0
                            p2_score = 1 if winner_user == tmatch.player2.user else 0
                            TournamentService.report_match_result(
                                tournament_match_id=tmatch.id,
                                winner_participant_id=winner_participant.id,
                                player1_score=p1_score,
                                player2_score=p2_score
                            )
                    except Exception as e:
                        pass

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
        
        trigger_bot_move_async(match)
        
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


# =========================
# BOT PLAY IMPLEMENTATION
# =========================

import threading
import time
import random

_running_bot_matches = set()
_running_bot_matches_lock = threading.Lock()

def trigger_bot_move_async(match):
    current_turn = match.current_turn
    if not (current_turn and current_turn.username.startswith('bot_')):
        return

    match_id_str = str(match.id)
    bot_id_str = str(current_turn.id)
    with _running_bot_matches_lock:
        if (match_id_str, bot_id_str) in _running_bot_matches:
            return

    from django.db import connection
    if connection.in_atomic_block:
        transaction.on_commit(lambda: threading.Thread(
            target=bot_agent_thread,
            args=(match_id_str, bot_id_str)
        ).start())
    else:
        threading.Thread(
            target=bot_agent_thread,
            args=(match_id_str, bot_id_str)
        ).start()

def bot_agent_thread(match_id, bot_id):
    from django.db import OperationalError
    import random

    match_id_str = str(match_id)
    bot_id_str = str(bot_id)
    with _running_bot_matches_lock:
        if (match_id_str, bot_id_str) in _running_bot_matches:
            return
        _running_bot_matches.add((match_id_str, bot_id_str))

    new_match = None
    event_type = None

    try:
        # Randomized delay to stagger bot moves and prevent SQLite database lock contention
        time.sleep(1.0 + random.uniform(0.2, 1.8))

        Match = get_match_model()
        
        retries = 5
        for attempt in range(retries):
            try:
                match = Match.objects.select_related('player1', 'player2', 'series').get(id=match_id)
                if match.status != 'active' or str(match.current_turn_id) != bot_id:
                    return

                # Decide move
                game_state = match.game_state
                game_type = game_state.get('gameType', 'tictactoe')
                chosen_move = None

                bot_symbol = player_symbol(match, bot_id)
                engine = get_engine(game_type)
                if hasattr(engine, 'get_bot_move'):
                    chosen_move = engine.get_bot_move(game_state, bot_symbol)
                elif game_type == 'chess':
                    legal_moves = game_state.get('legalMoves', [])
                    if legal_moves:
                        chosen_move = random.choice(legal_moves)
                else:
                    board = game_state.get('board', [])
                    empty_cells = [i for i, cell in enumerate(board) if cell is None]
                    if empty_cells:
                        chosen_move = random.choice(empty_cells)

                if chosen_move is None:
                    return

                new_match, event_type = make_move(match_id, bot_id, chosen_move)
                break
            except OperationalError as oe:
                if "locked" in str(oe).lower() and attempt < retries - 1:
                    # database locked, sleep and retry
                    time.sleep(random.uniform(0.2, 0.6))
                    continue
                print(f"Bot database operational error: {oe}")
                return
            except Exception as e:
                print(f"Bot make_move error for match {match_id}: {e}")
                return
    finally:
        with _running_bot_matches_lock:
            _running_bot_matches.discard((match_id_str, bot_id_str))

    if not new_match:
        return

    # Broadcast update
    channel_layer = get_channel_layer()
    room_group_name = f"match_{match_id}"
    
    series_info = None
    if new_match.series:
        series_info = {
            'id': str(new_match.series.id),
            'player1_wins': new_match.series.player1_wins,
            'player2_wins': new_match.series.player2_wins,
            'is_complete': new_match.series.is_complete(),
        }

    if event_type == 'GAME_OVER':
        winner_symbol = new_match.game_state.get('winner')
        if game_type == 'chess':
            reason = 'checkmate' if winner_symbol != 'draw' else 'draw'
        elif game_type == 'whot':
            reason = 'hand_cleared' if winner_symbol != 'draw' else 'draw'
        else:
            reason = 'board_full' if winner_symbol == 'draw' else 'three_in_row'
        async_to_sync(channel_layer.group_send)(
            room_group_name,
            {
                'type': 'game_over',
                'winner': winner_symbol,
                'reason': reason,
                'board': new_match.game_state['board'],
                'series': series_info,
                'gameType': game_type,
                'boardTheme': new_match.game_state.get('boardTheme', 'lichess'),
                'customStyles': new_match.game_state.get('customStyles', {}),
                'fen': new_match.game_state.get('fen'),
            }
        )
    else:
        async_to_sync(channel_layer.group_send)(
            room_group_name,
            {
                'type': 'move_made',
                'board': new_match.game_state['board'],
                'nextPlayer': new_match.game_state['currentPlayer'],
                'turnEndsAt': new_match.game_state['turnEndsAt'],
                'series': series_info,
                'gameType': game_type,
                'boardTheme': new_match.game_state.get('boardTheme', 'lichess'),
                'customStyles': new_match.game_state.get('customStyles', {}),
                'legalMoves': new_match.game_state.get('legalMoves', []),
                'fen': new_match.game_state.get('fen'),
            }
        )
