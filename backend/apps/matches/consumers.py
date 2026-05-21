import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

class MatchConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.match_id = self.scope['url_route']['kwargs']['match_id']
        self.room_group_name = f'match_{self.match_id}'
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')
        user = self.scope['user']
        
        if action == 'move':
            row = data['row']
            col = data['col']
            player_id = data.get('player_id')  # Allow frontend to send player_id
            if not player_id:
                # Fallback to authenticated user
                player_id = user.id if user.is_authenticated else None
            if not player_id:
                await self.send(text_data=json.dumps({'error': 'Not authenticated'}))
                return
            try:
                match = await self._make_move(self.match_id, player_id, row, col)
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'move_made',
                        'game_state': match.game_state,
                        'status': match.status,
                        'winner_id': match.winner_id,
                    }
                )
            except ValueError as e:
                await self.send(text_data=json.dumps({'error': str(e)}))

    async def move_made(self, event):
        await self.send(text_data=json.dumps({
            'type': 'state_update',
            'game_state': event['game_state'],
            'status': event['status'],
            'winner_id': event['winner_id'],
        }))

    @database_sync_to_async
    def _make_move(self, match_id, user_id, row, col):
        # Import here to avoid loading models at startup
        from .services import make_move
        return make_move(match_id, user_id, row, col)