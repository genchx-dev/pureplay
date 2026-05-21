from django.core.cache import cache
from apps.matches.services import create_match, join_match

def join_queue(user_id):
    """Add user to queue. Returns (match_id, waiting)"""
    waiting = cache.get('waiting_queue', [])
    # Remove user if already in queue (avoid duplicates)
    if user_id in waiting:
        waiting.remove(user_id)
    if waiting:
        # Pair with first waiting user
        opponent_id = waiting.pop(0)
        # Create match and join both players
        match = create_match(opponent_id)
        join_match(match.id, user_id)
        # Store match ID for both players (so polling can return it)
        cache.set(f'match_for_{opponent_id}', match.id, 300)
        cache.set(f'match_for_{user_id}', match.id, 300)
        # Update waiting queue
        cache.set('waiting_queue', waiting, 300)
        return match.id, False
    else:
        waiting.append(user_id)
        cache.set('waiting_queue', waiting, 300)
        return None, True

def check_queue(user_id):
    """Polling check: returns (match_id, waiting, queue_position)"""
    match_id = cache.get(f'match_for_{user_id}')
    if match_id:
        # Clear after returning once
        cache.delete(f'match_for_{user_id}')
        return match_id, False, 0
    waiting = cache.get('waiting_queue', [])
    if user_id in waiting:
        position = waiting.index(user_id) + 1
        return None, True, position
    return None, False, 0