# pureplay-main/backend/apps/matchmaking/services.py

from decimal import Decimal
from datetime import timedelta
from django.db import transaction
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from .models import Challenge
from apps.matches.models import Match
from apps.wallet.services import WalletService
from apps.matches.services import create_series, create_match, join_match   # <-- added


class ChallengeService:
    CHALLENGE_TIMEOUT_MINUTES = 5

    @classmethod
    def _send_ws_event(cls, user_id, event_type, challenge_data):
        """Helper to send WebSocket event to a specific user."""
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"challenge_{user_id}",
            {
                'type': 'challenge_event',
                'event_type': event_type,
                'challenge_data': challenge_data,
            }
        )

    @classmethod
    def send_challenge(cls, from_user, to_user, stake_amount=0, game_type='tictactoe'):
        if from_user == to_user:
            raise ValueError("Cannot challenge yourself")

        stake = Decimal(str(stake_amount))
        if stake < 0:
            raise ValueError("Stake cannot be negative")

        existing = Challenge.objects.filter(
            from_user=from_user,
            to_user=to_user,
            status='pending'
        ).exists()
        if existing:
            raise ValueError("You already have a pending challenge to this user")

        if stake > 0:
            wallet = WalletService.get_wallet(from_user)
            if wallet.balance < stake:
                raise ValueError("Insufficient balance to stake that amount")

        expires_at = timezone.now() + timedelta(minutes=cls.CHALLENGE_TIMEOUT_MINUTES)
        challenge = Challenge.objects.create(
            from_user=from_user,
            to_user=to_user,
            game_type=game_type,
            stake_amount=stake,
            expires_at=expires_at,
            status='pending'
        )

        # Send WebSocket notification to challenged user
        cls._send_ws_event(
            to_user.id,
            'NEW_CHALLENGE',
            {
                'id': challenge.id,
                'from_user': from_user.username,
                'from_user_id': from_user.id,
                'stake_amount': float(stake),
                'game_type': game_type,
                'expires_at': expires_at.isoformat(),
            }
        )

        return challenge

    @classmethod
    @transaction.atomic
    def accept_challenge(cls, challenge_id, accepting_user):
        try:
            challenge = Challenge.objects.select_for_update().get(id=challenge_id)
        except Challenge.DoesNotExist:
            raise ValueError("Challenge not found")

        if challenge.status != 'pending':
            raise ValueError(f"Challenge already {challenge.status}")

        if challenge.is_expired():
            challenge.expire()
            raise ValueError("Challenge has expired")

        if challenge.to_user != accepting_user:
            raise ValueError("You are not the recipient of this challenge")

        # Lock stake from challenger (only for staked challenges)
        if challenge.stake_amount > 0:
            WalletService.lock_funds(challenge.from_user, challenge.stake_amount)

        # ============================================================
        # CREATE MATCH OR SERIES (best‑of‑3 for Tic Tac Toe)
        # ============================================================
        if challenge.game_type == 'tictactoe' or challenge.stake_amount > 0:
            # Tic Tac Toe or staked challenge → best‑of‑3 series
            series, match = create_series(
                challenge.from_user.id,
                challenge.to_user.id,
                challenge.game_type,
                challenge.stake_amount
            )
        else:
            # Other free games → single match
            match = create_match(challenge.from_user.id, challenge.game_type, stake=0)
            join_match(match.id, challenge.to_user.id)

        challenge.status = 'accepted'
        challenge.save(update_fields=['status'])

        # Notify both users
        for user in [challenge.from_user, challenge.to_user]:
            cls._send_ws_event(
                user.id,
                'CHALLENGE_ACCEPTED',
                {
                    'challenge_id': challenge.id,
                    'match_id': match.id,
                    'opponent_username': challenge.to_user.username if user == challenge.from_user else challenge.from_user.username,
                }
            )

        return {
            'challenge': challenge,
            'match_id': match.id,
        }

    @classmethod
    def decline_challenge(cls, challenge_id, declining_user):
        try:
            challenge = Challenge.objects.get(id=challenge_id)
        except Challenge.DoesNotExist:
            raise ValueError("Challenge not found")

        if challenge.status != 'pending':
            raise ValueError(f"Challenge already {challenge.status}")

        if challenge.to_user != declining_user:
            raise ValueError("You are not the recipient")

        challenge.status = 'declined'
        challenge.save(update_fields=['status'])

        # Notify the sender
        cls._send_ws_event(
            challenge.from_user.id,
            'CHALLENGE_DECLINED',
            {
                'challenge_id': challenge.id,
                'by_user': declining_user.username,
            }
        )

        return challenge

    @classmethod
    def auto_expire_challenges(cls):
        expired_qs = Challenge.objects.filter(status='pending', expires_at__lte=timezone.now())
        for challenge in expired_qs:
            challenge.status = 'expired'
            challenge.save(update_fields=['status'])
            # Notify the sender that challenge expired
            cls._send_ws_event(
                challenge.from_user.id,
                'CHALLENGE_EXPIRED',
                {
                    'challenge_id': challenge.id,
                    'to_user': challenge.to_user.username,
                }
            )
        return expired_qs.count()