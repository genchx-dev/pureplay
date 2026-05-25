# pureplay-main/backend/apps/matches/models.py

import uuid
from django.db import models
from django.conf import settings

class Series(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('completed', 'Completed'),
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    player1 = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='series_as_p1')
    player2 = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='series_as_p2')
    stake = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    player1_wins = models.IntegerField(default=0)
    player2_wins = models.IntegerField(default=0)
    winner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    game_type = models.CharField(max_length=50, default='tictactoe')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Series {self.id}: {self.player1.username} vs {self.player2.username}"

    def is_complete(self):
        return self.player1_wins >= 2 or self.player2_wins >= 2

    def get_winner(self):
        if self.player1_wins >= 2:
            return self.player1
        if self.player2_wins >= 2:
            return self.player2
        return None

class Match(models.Model):
    STATUS_CHOICES = (
        ('waiting', 'Waiting for opponent'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('abandoned', 'Abandoned'),
    )
    player1 = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='matches_as_player1')
    player2 = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name='matches_as_player2')
    status = models.CharField(max_length=20, default='waiting')
    game_state = models.JSONField(default=dict)
    winner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='won_matches')
    current_turn = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='turn_matches')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Series fields
    series = models.ForeignKey(Series, on_delete=models.SET_NULL, null=True, blank=True, related_name='matches')
    game_number = models.IntegerField(default=1)

    def __str__(self):
        return f"Match {self.id} ({self.player1} vs {self.player2 or '?'})"