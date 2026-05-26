# pureplay-main/backend/apps/matches/services.py

from datetime import datetime, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

from apps.wallet.services import WalletService
from apps.rankings.services import RankingService
from apps.games.registry import get_engine   # <-- engine registry

TURN_SECONDS = 10


def get_match_model():
    from .models import Match
    return Match


def iso(dt):
    return dt.isoformat().replace('+00:00', 'Z')


def turn_deadline():
    return timezone.now() + timedelta(seconds=TURN_SECONDS)


def player_symbol(match, user_id):
    """Return 'X' or 'O' for a given user in the match."""
    players = (match.game_state or {}).get('players') or {}
    for symbol, player_id in players.items():
        if str(player_id) == str(user_id):
            return symbol
    return None


# =========================
# MATCH CREATION
# =========================

def create_match(player1_id, game_type='tictactoe', stake=0):
    Match = get_match_model()
    User = get_user_model()
    player1 = User.objects.get(id=player1_id)
    stake_decimal = Decimal(str(stake))

    engine = get_engine(game_type)
    # initial state without player2 (empty string for now)
    initial_state = engine.get_initial_state(str(player1_id), '', stake=stake_decimal)
    # Add turnEndsAt later, after player2 joins
    initial_state['turnEndsAt'] = None

    with transaction.atomic():
        match = Match.objects.create(
            player1=player1,
            status='waiting',
            game_state=initial_state,
        )

        # Lock stake immediately
        if stake_decimal > 0:
            WalletService.lock_stake(player1, stake_decimal, match.id)

    return match


def create_series(player1_id, player2_id, game_type='tictactoe', stake=0):
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
        initial_state['turnEndsAt'] = iso(turn_deadline())

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
# JOIN MATCH (improved – uses engine to find second symbol)
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

        # Lock stake for player 2
        if stake > 0:
            WalletService.lock_stake(player2, stake, match.id)

        # Get engine for this game type
        game_type = match.game_state.get('gameType', 'tictactoe')
        engine = get_engine(game_type)

        state = match.game_state
        players = state.get('players', {})

        # Determine the symbol for player2: find the missing one from {'X','O'}
        # For other games, the engine might have different symbols.
        # We assume two-player games have exactly two symbols.
        # We'll get the existing symbol from the first player.
        existing_symbols = set(players.keys())
        if len(existing_symbols) == 1:
            first_symbol = next(iter(existing_symbols))
            second_symbol = engine.get_opponent_symbol(first_symbol)
            players[second_symbol] = str(player2.id)
        else:
            raise ValueError("Match already has two players")

        state['players'] = players
        deadline = turn_deadline()
        state['turnEndsAt'] = iso(deadline)

        match.player2 = player2
        match.status = 'active'
        match.current_turn = match.player1   # first player goes first
        match.game_state = state

        match.save(update_fields=['player2', 'status', 'current_turn', 'game_state', 'updated_at'])

        return match

# =========================
# MOVE + AUTO SETTLEMENT (USING ENGINE)
# =========================

def make_move(match_id, player_id, move):
    Match = get_match_model()

    with transaction.atomic():
        match = Match.objects.select_for_update().select_related('player1', 'player2').get(id=match_id)

        if match.status != 'active':
            raise ValueError('Match not active')

        symbol = player_symbol(match, player_id)
        if not symbol:
            raise ValueError('You are not a player in this match')

        state = match.game_state.copy()
        if 'currentRound' not in state:
            state['currentRound'] = 1
        if 'roundScores' not in state:
            state['roundScores'] = {'X': 0, 'O': 0}
        if 'roundWinner' not in state:
            state['roundWinner'] = None

        game_type = state.get('gameType', 'tictactoe')
        engine = get_engine(game_type)

        # Validate move
        valid, error = engine.validate_move(state, symbol, move)
        if not valid:
            raise ValueError(error)

        # Apply move
        new_state = engine.apply_move(state, symbol, move)
        if 'currentRound' not in new_state:
            new_state['currentRound'] = state['currentRound']
        if 'roundScores' not in new_state:
            new_state['roundScores'] = state['roundScores'].copy()
        
        # Reset roundWinner at start of turn
        new_state['roundWinner'] = None

        # Check game over
        is_over, winner_symbol, _ = engine.check_game_over(new_state)

        stake = Decimal(state.get('stake', '0'))

        # =========================
        # GAME OVER (ROUND OR SERIES)
        # =========================
        if is_over:
            # Update round winner
            new_state['roundWinner'] = winner_symbol

            # Increment scores
            if winner_symbol != 'draw':
                scores = new_state['roundScores'].copy()
                scores[winner_symbol] = scores.get(winner_symbol, 0) + 1
                new_state['roundScores'] = scores

            scores = new_state['roundScores']
            
            # Check if someone reached 2 wins
            if scores.get('X', 0) >= 2 or scores.get('O', 0) >= 2:
                # MATCH is complete!
                new_state['turnEndsAt'] = None
                
                final_winner_symbol = 'X' if scores.get('X', 0) >= 2 else 'O'
                new_state['winner'] = final_winner_symbol
                winner_id = new_state.get('players', {}).get(final_winner_symbol)
                match.winner_id = winner_id

                winner = match.player1 if str(match.player1_id) == str(winner_id) else match.player2
                loser = match.player2 if winner == match.player1 else match.player1

                if stake > 0:
                    WalletService.settle_match(
                        winner=winner,
                        loser=loser,
                        stake_amount=stake,
                        match_id=match.id
                    )

                # Ranking update for win
                RankingService.update_after_match(match.id, winner, loser)

                match.status = 'completed'
                match.game_state = new_state
                match.save(update_fields=['winner_id', 'status', 'game_state', 'updated_at'])

                return match, 'GAME_OVER', None

            # Series continues: start next round
            new_state['currentRound'] = new_state['currentRound'] + 1
            completed_board = new_state['board'].copy()
            new_state['board'] = [None] * 9  # reset board
            
            # Alternate starting player for next round
            next_start_symbol = 'X' if new_state['currentRound'] % 2 == 1 else 'O'
            new_state['currentPlayer'] = next_start_symbol
            
            # Set turn deadline for next player
            new_state['turnEndsAt'] = iso(turn_deadline())

            if next_start_symbol == 'X':
                match.current_turn = match.player1
            else:
                match.current_turn = match.player2

            match.game_state = new_state
            match.save(update_fields=['current_turn', 'game_state', 'updated_at'])

            return match, 'ROUND_OVER', completed_board

        # =========================
        # CONTINUE GAME
        # =========================

        # Set turn deadline for next player
        new_state['turnEndsAt'] = iso(turn_deadline())

        # Determine whose turn it is (engine may have set currentPlayer)
        current_player_symbol = engine.get_current_player(new_state)
        if current_player_symbol == 'X':
            match.current_turn = match.player1
        else:
            match.current_turn = match.player2

        match.game_state = new_state
        match.save(update_fields=['current_turn', 'game_state', 'updated_at'])

        return match, 'MOVE_MADE', None


# =========================
# TURN EXPIRY (USING ENGINE)
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

        # Use engine to get opponent symbol
        engine = get_engine(state.get('gameType', 'tictactoe'))
        current = engine.get_current_player(state)
        next_player = engine.get_opponent_symbol(current)   # ✅ generic

        state['currentPlayer'] = next_player
        state['turnEndsAt'] = iso(turn_deadline())

        # Update match.current_turn based on symbol
        if next_player == 'X':
            match.current_turn = match.player1
        else:
            match.current_turn = match.player2

        match.game_state = state
        match.save(update_fields=['current_turn', 'game_state', 'updated_at'])

        return match, current