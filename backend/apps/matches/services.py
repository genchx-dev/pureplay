from django.contrib.auth import get_user_model
from django.db import transaction
from apps.games.tictactoe.engine import TicTacToeEngine

engine = TicTacToeEngine()

def get_match_model():
    from .models import Match
    return Match

def create_match(player1_id):
    Match = get_match_model()
    User = get_user_model()
    player1 = User.objects.get(id=player1_id)
    match = Match.objects.create(
        player1=player1,
        status='waiting',
        game_state=engine.initial_state()
    )
    return match

def join_match(match_id, player2_id):
    Match = get_match_model()
    User = get_user_model()
    match = Match.objects.get(id=match_id)
    if match.status != 'waiting':
        raise ValueError('Match not available')
    player2 = User.objects.get(id=player2_id)
    match.player2 = player2
    match.status = 'active'
    match.game_state['current_turn'] = match.player1.id
    match.current_turn = match.player1
    match.save()
    return match

def make_move(match_id, player_id, row, col):
    Match = get_match_model()
    match = Match.objects.select_related('player1', 'player2').get(id=match_id)
    if match.status != 'active':
        raise ValueError('Match not active')
    if match.current_turn_id != player_id:
        raise ValueError('Not your turn')
    
    state = match.game_state
    is_valid, error = engine.validate_move(state, player_id, {'row': row, 'col': col})
    if not is_valid:
        raise ValueError(error)
    
    new_state = engine.apply_move(state, {'row': row, 'col': col})
    if match.current_turn_id == match.player1_id:
        new_state['current_turn'] = match.player2_id
        match.current_turn = match.player2
    else:
        new_state['current_turn'] = match.player1_id
        match.current_turn = match.player1
    
    winner_id = engine.check_winner(new_state)
    if winner_id:
        match.winner_id = winner_id
        match.status = 'completed'
        new_state['winner'] = winner_id
    elif engine.is_draw(new_state):
        match.status = 'completed'
        new_state['draw'] = True
    
    match.game_state = new_state
    match.save()
    return match