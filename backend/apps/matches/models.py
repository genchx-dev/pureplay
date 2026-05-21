from django.db import models
from django.conf import settings

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
    game_state = models.JSONField(default=dict)  # Current board and turn
    winner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='won_matches')
    current_turn = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='turn_matches')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Match {self.id} ({self.player1} vs {self.player2 or '?'})"