from django.db import models, transaction
from django.conf import settings
from decimal import Decimal
import uuid


class Wallet(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='wallet'
    )

    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    locked_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [models.Index(fields=['user'])]

    def __str__(self):
        return f"{self.user.username}'s Wallet - ₦{self.balance}"

    @property
    def available_balance(self):
        return self.balance - self.locked_balance

    def can_afford(self, amount):
        return self.available_balance >= Decimal(str(amount))

    # =========================
    # CORE WALLET OPERATIONS
    # =========================

    @transaction.atomic
    def lock_funds(self, amount):
        """
        Move funds from available balance into locked balance.
        Used when joining a match / challenge.
        """
        amount = Decimal(str(amount))

        if not self.can_afford(amount):
            raise ValueError("Insufficient available balance.")

        self.balance -= amount
        self.locked_balance += amount

        self.save(update_fields=['balance', 'locked_balance', 'updated_at'])

    @transaction.atomic
    def unlock_funds(self, amount):
        """
        Move funds from locked balance back to available balance.
        Used when match is cancelled or user is refunded before resolution.
        """
        amount = Decimal(str(amount))

        if self.locked_balance < amount:
            raise ValueError("Not enough locked funds.")

        self.locked_balance -= amount
        self.balance += amount

        self.save(update_fields=['balance', 'locked_balance', 'updated_at'])

    @transaction.atomic
    def deduct_locked_funds(self, amount):
        """
        Permanently remove funds from locked balance.
        Used when match is completed and stake is consumed.
        """
        amount = Decimal(str(amount))

        if self.locked_balance < amount:
            raise ValueError("Not enough locked funds.")

        self.locked_balance -= amount

        self.save(update_fields=['locked_balance', 'updated_at'])

    # =========================
    # DIRECT WALLET OPS
    # =========================

    @transaction.atomic
    def credit(self, amount):
        """Add money to wallet balance."""
        amount = Decimal(str(amount))
        self.balance += amount
        self.save(update_fields=['balance', 'updated_at'])

    @transaction.atomic
    def debit(self, amount):
        """Remove money from available balance."""
        amount = Decimal(str(amount))

        if not self.can_afford(amount):
            raise ValueError("Insufficient available balance.")

        self.balance -= amount
        self.save(update_fields=['balance', 'updated_at'])


class Transaction(models.Model):
    TRANSACTION_TYPES = (
        ('deposit', 'Deposit'),
        ('withdrawal', 'Withdrawal'),
        ('stake', 'Match Stake'),
        ('lock', 'Locked Funds'),
        ('win', 'Match Win'),
        ('refund', 'Refund'),
    )

    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('reversed', 'Reversed'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name='transactions')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES, db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='completed', db_index=True)
    reference_id = models.CharField(max_length=100, blank=True, null=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['wallet', '-created_at']),
            models.Index(fields=['transaction_type']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.transaction_type} - ₦{self.amount} ({self.wallet.user.username})"
    
class PaymentTransaction(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('success', 'Success'),
        ('failed', 'Failed'),
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    reference = models.CharField(max_length=100, unique=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    paystack_response = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.reference} - {self.status}"