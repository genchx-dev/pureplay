from django.db import transaction
from decimal import Decimal
from .models import Wallet, Transaction

class WalletService:
    @staticmethod
    @transaction.atomic
    def deposit(user, amount, description="Deposit"):
        wallet, _ = Wallet.objects.get_or_create(user=user)
        wallet.balance += Decimal(str(amount))
        wallet.save()
        
        return Transaction.objects.create(
            wallet=wallet,
            amount=Decimal(str(amount)),
            transaction_type='deposit',
            description=description,
            status='completed'
        )

    @staticmethod
    @transaction.atomic
    def withdraw(user, amount, description="Withdrawal"):
        wallet = Wallet.objects.select_for_update().get(user=user)
        amount_decimal = Decimal(str(amount))
        
        if wallet.balance < amount_decimal:
            raise ValueError("Insufficient balance")
            
        wallet.balance -= amount_decimal
        wallet.save()
        
        return Transaction.objects.create(
            wallet=wallet,
            amount=amount_decimal,
            transaction_type='withdrawal',
            description=description,
            status='completed'
        )

    @staticmethod
    @transaction.atomic
    def lock_stake(user, amount, match_id):
        wallet = Wallet.objects.select_for_update().get(user=user)
        amount_decimal = Decimal(str(amount))
        
        if wallet.balance < amount_decimal:
            raise ValueError("Insufficient balance to join match")
            
        wallet.balance -= amount_decimal
        wallet.save()
        
        return Transaction.objects.create(
            wallet=wallet,
            amount=amount_decimal,
            transaction_type='stake',
            reference_id=str(match_id),
            description=f"Stake for Match {match_id}",
            status='completed'
        )

    @staticmethod
    @transaction.atomic
    def payout_win(user, amount, match_id):
        wallet, _ = Wallet.objects.get_or_create(user=user)
        amount_decimal = Decimal(str(amount))
        wallet.balance += amount_decimal
        wallet.save()
        
        return Transaction.objects.create(
            wallet=wallet,
            amount=amount_decimal,
            transaction_type='win',
            reference_id=str(match_id),
            description=f"Winnings from Match {match_id}",
            status='completed'
        )

    @staticmethod
    @transaction.atomic
    def refund_stake(user, amount, match_id, reason="Match Cancelled"):
        wallet, _ = Wallet.objects.get_or_create(user=user)
        amount_decimal = Decimal(str(amount))
        wallet.balance += amount_decimal
        wallet.save()
        
        return Transaction.objects.create(
            wallet=wallet,
            amount=amount_decimal,
            transaction_type='refund',
            reference_id=str(match_id),
            description=f"Refund: {reason}",
            status='completed'
        )
