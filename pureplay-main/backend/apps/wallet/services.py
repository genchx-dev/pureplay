# pureplay-main/backend/apps/wallet/services.py

from decimal import Decimal
from django.db import transaction
from .models import Wallet, Transaction


class WalletService:

    # =========================
    # BASIC WALLET OPERATIONS
    # =========================

    @staticmethod
    def get_wallet_locked(user):
        """Retrieve or create user's wallet with row-level database lock."""
        wallet, created = Wallet.objects.get_or_create(user=user)
        if not created:
            wallet = Wallet.objects.select_for_update().get(id=wallet.id)
        return wallet

    @staticmethod
    @transaction.atomic
    def deposit(user, amount, description="Deposit"):
        wallet = WalletService.get_wallet_locked(user)
        amount_decimal = Decimal(str(amount))

        wallet.balance += amount_decimal
        wallet.save()

        return Transaction.objects.create(
            wallet=wallet,
            amount=amount_decimal,
            transaction_type='deposit',
            description=description,
            status='completed'
        )

    @staticmethod
    @transaction.atomic
    def withdraw(user, amount, description="Withdrawal"):
        wallet = WalletService.get_wallet_locked(user)
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

    # =========================
    # STAKING / MATCH SYSTEM
    # =========================

    @staticmethod
    @transaction.atomic
    def lock_stake(user, amount, match_id):
        wallet = WalletService.get_wallet_locked(user)
        amount_decimal = Decimal(str(amount))

        if wallet.balance < amount_decimal:
            raise ValueError("Insufficient balance to join match")

        wallet.balance -= amount_decimal
        wallet.locked_balance += amount_decimal
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
    def lock_funds(user, amount):
        """Lock funds using model-level logic."""
        wallet = WalletService.get_wallet_locked(user)
        amount_decimal = Decimal(str(amount))

        try:
            wallet.lock_funds(amount_decimal)
        except ValueError as e:
            raise ValueError(str(e))

        return Transaction.objects.create(
            wallet=wallet,
            amount=amount_decimal,
            transaction_type='lock',
            status='completed',
            description="Locked for stake"
        )

    @staticmethod
    @transaction.atomic
    def consume_entry_fee(user, amount, tournament_id):
        """Consume and permanently deduct the locked entry fee when a tournament starts."""
        wallet = WalletService.get_wallet_locked(user)
        amount_decimal = Decimal(str(amount))

        wallet.deduct_locked_funds(amount_decimal)

        return Transaction.objects.create(
            wallet=wallet,
            amount=amount_decimal,
            transaction_type='stake',
            reference_id=str(tournament_id),
            description=f"Entry fee for Tournament {tournament_id}",
            status='completed'
        )

    # =========================
    # WIN / LOSS / REFUND
    # =========================

    @staticmethod
    @transaction.atomic
    def payout_win(user, amount, match_id):
        wallet = WalletService.get_wallet_locked(user)
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
        wallet = WalletService.get_wallet_locked(user)
        amount_decimal = Decimal(str(amount))

        wallet.balance += amount_decimal
        wallet.locked_balance = max(wallet.locked_balance - amount_decimal, Decimal("0"))
        wallet.save()

        return Transaction.objects.create(
            wallet=wallet,
            amount=amount_decimal,
            transaction_type='refund',
            reference_id=str(match_id),
            description=f"Refund: {reason}",
            status='completed'
        )

    # =========================
    # MATCH SETTLEMENT SYSTEM (FIXED & HARDENED)
    # =========================

    @staticmethod
    @transaction.atomic
    def settle_match(winner, loser, stake_amount, match_id, platform_fee_percent=5):
        """
        Settle a staked match correctly:
        - Winner: unlock their stake, then credit net winnings (loser's stake minus fee)
        - Loser: locked stake is permanently deducted
        - Locks resources in consistent order by User ID to prevent database deadlocks.
        """
        stake = Decimal(str(stake_amount))
        total_pool = stake * 2
        fee = total_pool * (Decimal(platform_fee_percent) / 100)
        winner_payout = total_pool - fee  # total amount added to winner's balance

        # Determine safe lock order (acquire lower ID first)
        if winner.id < loser.id:
            winner_wallet = WalletService.get_wallet_locked(winner)
            loser_wallet = WalletService.get_wallet_locked(loser)
        else:
            loser_wallet = WalletService.get_wallet_locked(loser)
            winner_wallet = WalletService.get_wallet_locked(winner)

        # Winner: unlock stake (move from locked to balance)
        winner_wallet.unlock_funds(stake)

        # Winner: credit net winnings (loser's stake minus fee)
        net_winning = stake - fee
        if net_winning > 0:
            winner_wallet.credit(net_winning)

        # Loser: permanently deduct locked stake
        loser_wallet.deduct_locked_funds(stake)

        Transaction.objects.create(
            wallet=winner_wallet,
            amount=winner_payout,
            transaction_type='win',
            reference_id=str(match_id),
            description=f"Winnings from match {match_id}",
            status='completed'
        )

        Transaction.objects.create(
            wallet=loser_wallet,
            amount=stake,
            transaction_type='stake_loss',
            reference_id=str(match_id),
            description=f"Stake lost in match {match_id}",
            status='completed'
        )

        return winner_payout, fee

    @staticmethod
    @transaction.atomic
    def refund_match_stakes(player1, player2, stake_amount, match_id, reason="Match abandoned/draw"):
        """Refund both players' locked stakes safely with lock ordering to prevent deadlocks."""
        stake = Decimal(str(stake_amount))

        # Consistent lock acquisition order (lower ID first)
        players = [player1, player2]
        players_sorted = sorted(players, key=lambda p: p.id)
        
        wallets = {}
        for player in players_sorted:
            wallets[player.id] = WalletService.get_wallet_locked(player)

        for player in players:
            wallet = wallets[player.id]
            wallet.unlock_funds(stake)  # moves locked -> balance

            Transaction.objects.create(
                wallet=wallet,
                amount=stake,
                transaction_type='refund',
                reference_id=str(match_id),
                description=f"Refund: {reason}",
                status='completed'
            )

    # =========================
    # UTIL
    # =========================

    @staticmethod
    def get_wallet(user):
        """Retrieve or create wallet (without row lock)."""
        wallet, _ = Wallet.objects.get_or_create(user=user)
        return wallet