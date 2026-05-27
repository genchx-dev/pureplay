# pureplay-main/backend/apps/matchmaking/queue.py

import time
import uuid
from decimal import Decimal
from typing import Dict, Optional, List
from django.utils import timezone
from datetime import timedelta

_queues = {}
_user_queues = {}


def generate_queue_id():
    return str(uuid.uuid4())


def ensure_queue_entry(user_id: int, game_type: str = 'tictactoe', stake: Decimal = Decimal(0)) -> Optional[str]:
    from apps.matches.models import Match
    from apps.matches.services import create_match
    
    # Check if user has a queue entry
    queue_id = _user_queues.get(user_id)
    if queue_id:
        entry = _queues.get(queue_id)
        if entry:
            # Check if match is still waiting
            match = Match.objects.get(id=entry['match_id'])
            if match.status == 'active':
                remove_queue_entry(queue_id)
                return str(match.id)
            
            # If stake/game changed, cancel and move on
            if entry['game_type'] != game_type or entry['stake'] != float(stake):
                cancel_queue_entry(user_id)
            else:
                return None # Still waiting
    
    # If we reached here, they are not in queue (or were just removed)
    # Check if they were RECENTLY matched (someone accepted their match and removed them from queue)
    recent_match = Match.objects.filter(player1_id=user_id, status='active').order_by('-updated_at').first()
    if recent_match and recent_match.updated_at > (timezone.now() - timedelta(seconds=15)):
        return str(recent_match.id)

    # Look for an existing open match to join
    open_match = None
    for qid, entry in _queues.items():
        # Don't match with self
        if entry['user_id'] == user_id:
            continue
        if entry['game_type'] == game_type and entry['stake'] == float(stake):
            open_match = entry
            break
    
    if open_match:
        match_id = accept_open_match(open_match['id'], user_id)
        return str(match_id)
    else:
        # Create a new match and wait
        match = create_match(user_id, game_type, stake=stake)
        queue_id = generate_queue_id()
        _queues[queue_id] = {
            'id': queue_id,
            'user_id': user_id,
            'game_type': game_type,
            'stake': float(stake),
            'match_id': str(match.id),
            'created_at': time.time(),
        }
        _user_queues[user_id] = queue_id
        return None


def cancel_queue_entry(user_id: int):
    queue_id = _user_queues.pop(user_id, None)
    if queue_id and queue_id in _queues:
        del _queues[queue_id]


def list_open_matches(exclude_user_id: int, game_type: str = 'tictactoe', stake: Optional[Decimal] = None) -> List[Dict]:
    result = []
    for qid, entry in _queues.items():
        if entry['user_id'] == exclude_user_id:
            continue
        if entry['game_type'] != game_type:
            continue
        if stake is not None and entry['stake'] != float(stake):
            continue
        result.append({
            'id': entry['id'],
            'user_id': entry['user_id'],
            'game_type': entry['game_type'],
            'stake': entry['stake'],
            'match_id': entry.get('match_id'),
            'created_at': entry['created_at'],
        })
    result.sort(key=lambda x: x['created_at'])
    return result


def accept_open_match(queue_id: str, player2_id: int) -> str:
    entry = _queues.get(queue_id)
    if not entry:
        raise ValueError("Queue entry not found")
    
    from apps.matches.models import Match, Series
    from apps.matches.services import join_match
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    match_id = entry['match_id']
    match = Match.objects.get(id=match_id)
    
    # If it's Tic Tac Toe or Chess, ensure it's a series (best of 3)
    if entry['game_type'] in ['tictactoe', 'chess'] and not match.series:
        player2 = User.objects.get(id=player2_id)
        series = Series.objects.create(
            player1=match.player1,
            player2=player2,
            stake=Decimal(str(entry['stake'])),
            game_type=entry['game_type']
        )
        match.series = series
        match.save(update_fields=['series'])

    join_match(match_id, player2_id)
    remove_queue_entry(queue_id)
    return match_id


def get_queue_entry(queue_id: str) -> Optional[Dict]:
    return _queues.get(queue_id)


def remove_queue_entry(queue_id: str):
    entry = _queues.pop(queue_id, None)
    if entry:
        _user_queues.pop(entry['user_id'], None)