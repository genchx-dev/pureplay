from django.db import transaction
from django.utils import timezone
from .models import Tournament, TournamentParticipant
from apps.wallet.services import WalletService

class TournamentService:
    @staticmethod
    @transaction.atomic
    def register_user(tournament_id, user):
        tournament = Tournament.objects.select_for_update().get(id=tournament_id)
        
        # Validation
        if tournament.status != 'registration_open':
            raise ValueError("Registration is not open for this tournament")
            
        if tournament.current_participants_count >= tournament.max_participants:
            raise ValueError("Tournament is full")
            
        if timezone.now() > tournament.registration_deadline:
            raise ValueError("Registration deadline has passed")
            
        if TournamentParticipant.objects.filter(tournament=tournament, user=user).exists():
            raise ValueError("User already registered for this tournament")
            
        # Deduct entry fee
        if tournament.entry_fee > 0:
            WalletService.lock_stake(
                user, 
                tournament.entry_fee, 
                f"tournament_{tournament.id}"
            )
            
        # Register participant
        participant = TournamentParticipant.objects.create(
            tournament=tournament,
            user=user
        )
        
        # Update count
        tournament.current_participants_count += 1
        tournament.save()
        
        return participant

    @staticmethod
    def list_active_tournaments():
        return Tournament.objects.filter(
            status__in=['upcoming', 'registration_open', 'active']
        ).order_by('start_time')
