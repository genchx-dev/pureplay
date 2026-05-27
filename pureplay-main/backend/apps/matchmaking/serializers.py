# pureplay-main/backend/apps/matchmaking/serializers.py

from rest_framework import serializers
from .models import Challenge
from apps.users.serializers import UserSerializer  # adjust if you have one


class ChallengeSerializer(serializers.ModelSerializer):
    from_user_details = UserSerializer(source='from_user', read_only=True)
    to_user_details = UserSerializer(source='to_user', read_only=True)

    class Meta:
        model = Challenge
        fields = [
            'id', 'from_user', 'to_user', 'game_type', 'stake_amount',
            'status', 'board_theme', 'created_at', 'expires_at',
            'from_user_details', 'to_user_details',
        ]
        read_only_fields = ['id', 'status', 'created_at', 'expires_at']