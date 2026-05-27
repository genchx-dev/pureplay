# pureplay-main/backend/apps/matchmaking/models.py

from django.db import models
from django.conf import settings
from django.utils import timezone

class Challenge(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
        ('expired', 'Expired'),
    )

    from_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_challenges'
    )
    to_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='received_challenges'
    )
    game_type = models.CharField(max_length=50, default='tictactoe')  # extensible for other games
    stake_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    board_theme = models.CharField(max_length=50, default='random')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['to_user', 'status']),
            models.Index(fields=['expires_at']),
        ]

    def __str__(self):
        return f"Challenge #{self.id}: {self.from_user} → {self.to_user} ({self.status})"

    def is_expired(self):
        return timezone.now() > self.expires_at

    def expire(self):
        if self.status == 'pending':
            self.status = 'expired'
            self.save(update_fields=['status'])