from django.db import models
from django.conf import settings
import uuid

class Tournament(models.Model):
    STATUS_CHOICES = (
        ('upcoming', 'Upcoming'),
        ('registration_open', 'Registration Open'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    game_type = models.CharField(max_length=50, default='tictactoe')
    
    entry_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_prize_pool = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    max_participants = models.PositiveIntegerField(default=16)
    current_participants_count = models.PositiveIntegerField(default=0)
    
    start_time = models.DateTimeField()
    registration_deadline = models.DateTimeField()
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='upcoming')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"

class TournamentParticipant(models.Model):
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tournaments_joined')
    joined_at = models.DateTimeField(auto_now_add=True)
    rank = models.PositiveIntegerField(null=True, blank=True)
    is_eliminated = models.BooleanField(default=False)

    class Meta:
        unique_together = ('tournament', 'user')

    def __str__(self):
        return f"{self.user.username} in {self.tournament.title}"
