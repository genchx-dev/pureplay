from rest_framework import serializers
from .models import Tournament, TournamentParticipant

class TournamentSerializer(serializers.ModelSerializer):
    is_joined = serializers.SerializerMethodField()
    name = serializers.CharField(source='title')
    gameType = serializers.CharField(source='game_type')
    entryFee = serializers.FloatField(source='entry_fee')
    prizePool = serializers.FloatField(source='total_prize_pool')
    startTime = serializers.DateTimeField(source='start_time')
    participants = serializers.IntegerField(source='current_participants_count')
    maxParticipants = serializers.IntegerField(source='max_participants')

    class Meta:
        model = Tournament
        fields = [
            'id', 'name', 'description', 'gameType', 
            'entryFee', 'prizePool', 'maxParticipants', 
            'participants', 'startTime', 
            'registration_deadline', 'status', 'is_joined'
        ]

    def get_is_joined(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return TournamentParticipant.objects.filter(tournament=obj, user=request.user).exists()
        return False
