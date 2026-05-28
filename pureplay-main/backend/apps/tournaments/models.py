# pureplay-main/backend/apps/tournaments/models.py

from django.db import models
from django.conf import settings
from django.utils import timezone
import uuid

class Tournament(models.Model):
    STATUS_CHOICES = (
        ('registering', 'Registration Open'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )
    BRACKET_TYPES = (
        ('single_elimination', 'Single Elimination'),
        ('double_elimination', 'Double Elimination'),
        ('swiss', 'Swiss'),
    )
    TOURNAMENT_TYPE_CHOICES = (
        ('knockout', 'Pure Knockout'),
        ('swiss_hybrid', 'Swiss Hybrid'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    game_type = models.CharField(max_length=50, default='tictactoe')
    bracket_type = models.CharField(max_length=30, choices=BRACKET_TYPES, default='single_elimination')
    tournament_type = models.CharField(max_length=20, choices=TOURNAMENT_TYPE_CHOICES, default='knockout')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='registering')
    entry_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    prize_pool = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    max_players = models.IntegerField(default=8)
    current_players = models.IntegerField(default=0)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_tournaments')
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    # Scheduling
    scheduled_start_time = models.DateTimeField(null=True, blank=True)   # when tournament auto-starts
    registration_deadline = models.DateTimeField(null=True, blank=True)  # when registration closes

    # Swiss Hybrid specific
    swiss_rounds = models.IntegerField(default=0)                 # number of Swiss rounds
    qualification_slots = models.IntegerField(default=0)          # how many advance to knockout
    current_swiss_round = models.IntegerField(default=0)          # 0 = not started
    # Prize distribution (JSON) e.g. {"1": 350000, "2": 200000, "3": 120000, "4": 80000, "5-6": 50000, "7-10": 25000}
    prize_distribution = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.status})"


class TournamentParticipant(models.Model):
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    joined_at = models.DateTimeField(auto_now_add=True)
    is_eliminated = models.BooleanField(default=False)
    current_rank = models.IntegerField(null=True, blank=True)          # final rank (1 = winner)
    swiss_points = models.DecimalField(max_digits=6, decimal_places=2, default=0)   # for Swiss stage
    swiss_game_diff = models.IntegerField(default=0)                  # tie‑breaker (games won - lost)

    class Meta:
        unique_together = ('tournament', 'user')
        indexes = [
            models.Index(fields=['tournament', 'swiss_points']),
        ]

    def __str__(self):
        return f"{self.user.username} in {self.tournament.name}"


class TournamentMatch(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Not Started'),
        ('active', 'In Progress'),
        ('completed', 'Completed'),
    )
    ROUND_TYPE_CHOICES = (
        ('play_in', 'Play‑in Round'),
        ('swiss', 'Swiss Round'),
        ('knockout', 'Knockout Round'),
    )

    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='matches')
    round_type = models.CharField(max_length=20, choices=ROUND_TYPE_CHOICES, default='knockout')
    round_number = models.IntegerField()                     # 0 = play‑in, 1..N for knockout, or Swiss round index
    match_order = models.IntegerField()                      # position in bracket or Swiss pair list
    player1 = models.ForeignKey(TournamentParticipant, on_delete=models.SET_NULL, null=True, related_name='matches_as_p1')
    player2 = models.ForeignKey(TournamentParticipant, on_delete=models.SET_NULL, null=True, related_name='matches_as_p2')
    winner = models.ForeignKey(TournamentParticipant, on_delete=models.SET_NULL, null=True, blank=True, related_name='won_matches')
    match_id = models.CharField(max_length=100, blank=True, null=True)   # reference to matches.Match id
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    scheduled_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    # Swiss specific: store game scores (e.g., 2-0, 2-1) for tie‑breakers
    player1_score = models.IntegerField(default=0)
    player2_score = models.IntegerField(default=0)

    class Meta:
        ordering = ['round_number', 'match_order']
        unique_together = ('tournament', 'round_number', 'match_order', 'round_type')

    def __str__(self):
        return f"{self.get_round_type_display()} R{self.round_number} M{self.match_order}"


class SwissRoundScore(models.Model):
    """Stores points earned by a participant in each Swiss round."""
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='swiss_scores')
    participant = models.ForeignKey(TournamentParticipant, on_delete=models.CASCADE, related_name='swiss_scores_as_participant')
    round_number = models.IntegerField()
    points = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    opponent = models.ForeignKey(TournamentParticipant, on_delete=models.SET_NULL, null=True, blank=True, related_name='swiss_scores_as_opponent')
    match = models.ForeignKey(TournamentMatch, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        unique_together = ('tournament', 'participant', 'round_number')
        ordering = ['tournament', 'round_number', '-points']

    def __str__(self):
        return f"{self.participant.user.username} - Round {self.round_number}: {self.points} pts"