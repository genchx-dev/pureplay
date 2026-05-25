# pureplay-main/backend/apps/tournaments/serializers.py

from rest_framework import serializers
from .models import Tournament, TournamentParticipant, TournamentMatch
from apps.users.serializers import UserSerializer  # adjust if you don't have this

class TournamentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tournament
        fields = [
            'id', 'name', 'game_type', 'bracket_type', 'status',
            'entry_fee', 'prize_pool', 'max_players', 'current_players',
            'created_at', 'started_at', 'completed_at'
        ]
        read_only_fields = ['id', 'prize_pool', 'current_players', 'created_at']

class TournamentDetailSerializer(serializers.ModelSerializer):
    participants = serializers.SerializerMethodField()
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = Tournament
        fields = [
            'id', 'name', 'game_type', 'bracket_type', 'status',
            'entry_fee', 'prize_pool', 'max_players', 'current_players',
            'created_at', 'started_at', 'completed_at', 'created_by', 'participants'
        ]

    def get_participants(self, obj):
        return [{'id': p.id, 'username': p.user.username} for p in obj.participants.all()]