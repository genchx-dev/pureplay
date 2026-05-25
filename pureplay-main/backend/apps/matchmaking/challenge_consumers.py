# pureplay-main/backend/apps/matchmaking/challenge_consumers.py

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from urllib.parse import parse_qs

from .models import Challenge
from .serializers import ChallengeSerializer


class ChallengeConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = await self.authenticate()
        if not self.user:
            await self.close(code=4401)
            return

        self.room_group_name = f"challenge_{self.user.id}"

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        # Not expecting client to send anything for now (just listen)
        pass

    async def challenge_event(self, event):
        """Send challenge event to client."""
        await self.send_json({
            'type': event['event_type'],
            'challenge': event['challenge_data'],
        })

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