from django.core.cache import cache

from apps.matches.services import create_match, join_match

QUEUE_KEY = 'matchmaking:tictactoe:waiting'
MATCHED_KEY = 'matchmaking:matched:{}'


def queue_id_for(user_id, game_type, stake):
    return f'{user_id}:{game_type}:{stake}'


def get_waiting():
    return cache.get(QUEUE_KEY, [])


def save_waiting(waiting):
    cache.set(QUEUE_KEY, waiting, 600)


def get_matched_match(user_id):
    key = MATCHED_KEY.format(user_id)
    match_id = cache.get(key)
    if match_id:
        cache.delete(key)
    return match_id


def ensure_queue_entry(user_id, game_type='tictactoe', stake=0):
    match_id = get_matched_match(user_id)
    if match_id:
        return match_id

    stake = str(stake)
    waiting = [item for item in get_waiting() if item['user_id'] != user_id]
    waiting.append({
        'id': queue_id_for(user_id, game_type, stake),
        'user_id': user_id,
        'game_type': game_type,
        'stake': stake,
    })
    save_waiting(waiting)
    return None


def cancel_queue_entry(user_id):
    save_waiting([item for item in get_waiting() if item['user_id'] != user_id])


def list_open_matches(user_id, game_type='tictactoe', stake=None):
    return [
        item for item in get_waiting()
        if item['user_id'] != user_id
        and item['game_type'] == game_type
        and (stake is None or str(item['stake']) == str(stake))
    ]


def accept_open_match(queue_id, accepter_id):
    waiting = get_waiting()
    selected = None
    remaining = []

    for item in waiting:
        if item['id'] == queue_id:
            selected = item
        elif item['user_id'] == accepter_id:
            continue
        else:
            remaining.append(item)

    if not selected:
        raise ValueError('Challenge is no longer available')
    if selected['user_id'] == accepter_id:
        raise ValueError('You cannot accept your own challenge')

    match = create_match(selected['user_id'], game_type=selected['game_type'], stake=selected['stake'])
    join_match(match.id, accepter_id)
    cache.set(MATCHED_KEY.format(selected['user_id']), match.id, 600)
    cache.set(MATCHED_KEY.format(accepter_id), match.id, 600)
    save_waiting(remaining)
    return match.id
