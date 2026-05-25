# pureplay-main/backend/apps/matchmaking/routing.py

from django.urls import re_path
from . import challenge_consumers

websocket_urlpatterns = [
    re_path(r'ws/challenges/$', challenge_consumers.ChallengeConsumer.as_asgi()),
]