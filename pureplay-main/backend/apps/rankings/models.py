# pureplay-main/backend/apps/rankings/models.py

from django.db import models
from django.conf import settings
from django.utils import timezone

class PlayerStats(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='stats')
    game_type = models.CharField(max_length=50, default='tictactoe')
    
    # Core stats
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    draws = models.IntegerField(default=0)
    total_matches = models.IntegerField(default=0)
    
    # XP & progression (official rules)
    xp = models.IntegerField(default=0)
    current_streak = models.IntegerField(default=0)   # consecutive wins
    longest_streak = models.IntegerField(default=0)
    
    # MMR (skill rating, used for matchmaking)
    mmr = models.IntegerField(default=1000)
    
    # Last match timestamp
    last_match_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ('user', 'game_type')
        indexes = [
            models.Index(fields=['game_type', '-mmr']),
            models.Index(fields=['game_type', '-xp']),
        ]
    
    def __str__(self):
        return f"{self.user.username} ({self.game_type}) - MMR: {self.mmr}, XP: {self.xp}, Rank: {self.rank_tier}"
    
    @property
    def rank_tier(self):
        """Return rank tier based on XP (official thresholds)."""
        if self.xp >= 300000:
            return "Ruby"
        elif self.xp >= 150000:
            return "Platinum"
        elif self.xp >= 75000:
            return "Diamond"
        elif self.xp >= 35000:
            return "Gold"
        elif self.xp >= 15000:
            return "Silver"
        elif self.xp >= 5000:
            return "Iron"
        elif self.xp >= 1000:
            return "Bronze"
        else:
            return "Wood"
    
    @property
    def next_tier_xp(self):
        """XP needed for next rank (0 if already max)."""
        thresholds = [1000, 5000, 15000, 35000, 75000, 150000, 300000]
        for threshold in thresholds:
            if self.xp < threshold:
                return threshold
        return 0

class MatchHistory(models.Model):
    match = models.OneToOneField('matches.Match', on_delete=models.CASCADE, related_name='history')
    game_type = models.CharField(max_length=50, default='tictactoe')
    player1 = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='history_as_p1')
    player2 = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='history_as_p2')
    winner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    player1_mmr_before = models.IntegerField()
    player2_mmr_before = models.IntegerField()
    player1_mmr_change = models.IntegerField(default=0)
    player2_mmr_change = models.IntegerField(default=0)
    player1_xp_gain = models.IntegerField(default=0)
    player2_xp_gain = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['player1', '-created_at']),
            models.Index(fields=['player2', '-created_at']),
        ]
    
    def __str__(self):
        return f"Match {self.match.id} - {self.player1} vs {self.player2}"