# pureplay-main/backend/apps/tournaments/serializers.py

from rest_framework import serializers
from .models import Tournament, TournamentParticipant, TournamentMatch
from apps.users.serializers import UserSerializer  # adjust if you don't have this

class TournamentSerializer(serializers.ModelSerializer):
    is_joined = serializers.SerializerMethodField()
    winners = serializers.SerializerMethodField()

    class Meta:
        model = Tournament
        fields = [
            'id', 'name', 'game_type', 'bracket_type', 'status',
            'entry_fee', 'prize_pool', 'max_players', 'current_players',
            'created_at', 'started_at', 'completed_at', 'is_joined', 'winners'
        ]
        read_only_fields = ['id', 'prize_pool', 'current_players', 'created_at']

    def get_is_joined(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            return obj.participants.filter(user=request.user).exists()
        return False

    def get_winners(self, obj):
        if obj.status == 'completed':
            participants = obj.participants.filter(current_rank__isnull=False).order_by('current_rank')[:5]
            return [{'rank': p.current_rank, 'username': p.user.username} for p in participants]
        return []

class TournamentDetailSerializer(serializers.ModelSerializer):
    participants = serializers.SerializerMethodField()
    created_by = UserSerializer(read_only=True)
    winners = serializers.SerializerMethodField()

    class Meta:
        model = Tournament
        fields = [
            'id', 'name', 'game_type', 'bracket_type', 'status',
            'entry_fee', 'prize_pool', 'max_players', 'current_players',
            'created_at', 'started_at', 'completed_at', 'created_by', 'participants', 'winners'
        ]

    def get_participants(self, obj):
        return [{'id': p.id, 'username': p.user.username} for p in obj.participants.all()]

    def get_winners(self, obj):
        if obj.status == 'completed':
            participants = obj.participants.filter(current_rank__isnull=False).order_by('current_rank')[:5]
            return [{'rank': p.current_rank, 'username': p.user.username} for p in participants]
        return []