from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver

class User(AbstractUser):
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    tier = models.CharField(max_length=20, default='Bronze')
    rank = models.PositiveIntegerField(default=1000)

@receiver(post_save, sender=User)
def create_user_wallet(sender, instance, created, **kwargs):
    if created:
        try:
            from apps.wallet.services import WalletService
            # Automatically create wallet and add 5,000 welcome bonus
            WalletService.deposit(instance, 5000, description="Welcome Bonus")
        except Exception as e:
            # Prevent user creation from failing if wallet service fails
            print(f"Failed to create welcome bonus: {e}")
