import asyncio
import json
from datetime import datetime
from urllib.parse import parse_qs

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token

from .services import make_move, player_symbol, skip_expired_turn

class MatchConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.match_id = self.scope['url_route']['kwargs']['match_id']
        self.room_group_name = f'match_{self.match_id}'
        self.turn_task = None
        self.user = await self.authenticate()

        if not self.user:
            await self.close(code=4401)
            return

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()
        await self.send_match_start()
        await self.schedule_turn_timeout()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        if self.turn_task:
            self.turn_task.cancel()

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            await self.send_error('Invalid message')
            return

        if data.get('type') != 'MAKE_MOVE':
            await self.send_error('Unsupported event')
            return

        position = (data.get('payload') or {}).get('position')
        try:
            match, event_type = await database_sync_to_async(make_move)(self.match_id, self.user.id, position)
        except ValueError as exc:
            await self.send_error(str(exc))
            return

        if event_type == 'GAME_OVER':
            await self.channel_layer.group_send(self.room_group_name, self.game_over_payload(match))
            return

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'move_made',
                'board': match.game_state['board'],
                'nextPlayer': match.game_state['currentPlayer'],
                'turnEndsAt': match.game_state['turnEndsAt'],
            }
        )
        await self.schedule_turn_timeout()

    async def move_made(self, event):
        await self.send_json({
            'type': 'MOVE_MADE',
            'board': event['board'],
            'nextPlayer': event['nextPlayer'],
            'turnEndsAt': event['turnEndsAt'],
        })

    async def turn_skip(self, event):
        await self.send_json({
            'type': 'TURN_SKIP',
            'skippedPlayer': event['skippedPlayer'],
            'nextPlayer': event['nextPlayer'],
            'board': event['board'],
            'turnEndsAt': event['turnEndsAt'],
        })

    async def game_over(self, event):
        await self.send_json({
            'type': 'GAME_OVER',
            'winner': event['winner'],
            'reason': event['reason'],
            'board': event['board'],
            **({'payout': event['payout']} if event.get('payout') else {}),
        })

    async def send_match_start(self):
        match = await self.get_match()
        symbol = player_symbol(match, self.user.id)
        state = match.game_state or {}
        await self.send_json({
            'type': 'MATCH_START',
            'matchId': str(match.id),
            'board': state.get('board') or [None] * 9,
            'currentPlayer': state.get('currentPlayer', 'X'),
            'playerSymbol': symbol,
            'turnEndsAt': state.get('turnEndsAt'),
        })

    async def schedule_turn_timeout(self):
        if self.turn_task:
            self.turn_task.cancel()

        match = await self.get_match()
        turn_ends_at = (match.game_state or {}).get('turnEndsAt')
        if match.status != 'active' or not turn_ends_at:
            return

        deadline = datetime.fromisoformat(turn_ends_at.replace('Z', '+00:00'))
        wait_seconds = max(0, (deadline - datetime.now(tz=deadline.tzinfo)).total_seconds())
        self.turn_task = asyncio.create_task(self.handle_turn_timeout(wait_seconds))

    async def handle_turn_timeout(self, wait_seconds):
        await asyncio.sleep(wait_seconds)
        result = await database_sync_to_async(skip_expired_turn)(self.match_id)
        if not result:
            return

        match, skipped_player = result
        await self.channel_layer.group_send(self.room_group_name, {
            'type': 'turn_skip',
            'skippedPlayer': skipped_player,
            'nextPlayer': match.game_state['currentPlayer'],
            'board': match.game_state['board'],
            'turnEndsAt': match.game_state['turnEndsAt'],
        })
        await self.schedule_turn_timeout()

    def game_over_payload(self, match):
        winner = match.game_state.get('winner')
        payload = {
            'type': 'game_over',
            'winner': winner,
            'reason': 'board_full' if winner == 'draw' else 'three_in_row',
            'board': match.game_state['board'],
        }
        if winner != 'draw':
            payload['payout'] = {
                'winnerAmount': 0,
                'platformFee': 0,
            }
        return payload

    async def send_error(self, message):
        await self.send_json({'type': 'ERROR', 'message': message})

    async def send_json(self, payload):
        await self.send(text_data=json.dumps(payload))

    async def authenticate(self):
        query = parse_qs(self.scope.get('query_string', b'').decode())
        token = (query.get('token') or [None])[0]
        if not token:
            return None
        return await self.get_user_for_token(token)

    @database_sync_to_async
    def get_user_for_token(self, token):
        try:
            return Token.objects.select_related('user').get(key=token).user
        except Token.DoesNotExist:
            return None

    @database_sync_to_async
    def get_match(self):
        from .models import Match
        return Match.objects.get(id=self.match_id)
