# pureplay-main/backend/apps/tournaments/services.py

from decimal import Decimal
import random
import math
from django.db import models, transaction
from django.utils import timezone
from django.core.cache import cache
from apps.wallet.services import WalletService
from apps.matches.services import create_match, join_match
from .models import Tournament, TournamentParticipant, TournamentMatch, SwissRoundScore


class KnockoutService:
    """Pure Knockout tournament with play‑in rounds and top‑N ranking/payouts."""

    @staticmethod
    def calculate_play_in_rounds(total_players):
        """Return (players_after_playin, number_of_playin_matches)."""
        # Find nearest power of two <= total_players
        power = 1 << (total_players.bit_length() - 1)
        if power == total_players:
            return total_players, 0
        players_needed = power
        playin_matches = total_players - players_needed
        return players_needed, playin_matches

    @staticmethod
    @transaction.atomic
    def generate_bracket(tournament):
        participants = list(TournamentParticipant.objects.filter(tournament=tournament))
        random.shuffle(participants)
        total_players = len(participants)
        target_players, playin_count = KnockoutService.calculate_play_in_rounds(total_players)

        # 1. Create play-in matches if needed
        if playin_count > 0:
            playin_players = participants[:playin_count * 2]
            rest = participants[playin_count * 2:]
            for i in range(playin_count):
                TournamentMatch.objects.create(
                    tournament=tournament,
                    round_type='play_in',
                    round_number=0,
                    match_order=i + 1,
                    player1=playin_players[i*2],
                    player2=playin_players[i*2+1],
                    status='pending'
                )
        else:
            rest = participants

        # 2. Create the main knockout bracket matches
        # Round 1 has target_players // 2 matches in total
        r1_match_count = target_players // 2
        rest_count = len(rest)
        
        for i in range(1, r1_match_count + 1):
            slot1_idx = 2 * (i - 1)
            slot2_idx = 2 * (i - 1) + 1
            
            p1 = rest[slot1_idx] if slot1_idx < rest_count else None
            p2 = rest[slot2_idx] if slot2_idx < rest_count else None
            
            TournamentMatch.objects.create(
                tournament=tournament,
                round_type='knockout',
                round_number=1,
                match_order=i,
                player1=p1,
                player2=p2,
                status='pending'
            )
            
        # Generate subsequent rounds (Round 2 to Final)
        current_round_matches = r1_match_count
        round_number = 2
        while current_round_matches > 1:
            next_round_matches = current_round_matches // 2
            for i in range(1, next_round_matches + 1):
                TournamentMatch.objects.create(
                    tournament=tournament,
                    round_type='knockout',
                    round_number=round_number,
                    match_order=i,
                    player1=None,
                    player2=None,
                    status='pending'
                )
            current_round_matches = next_round_matches
            round_number += 1

        # Check and start bot matches
        KnockoutService.check_and_start_bot_matches(tournament)

    @staticmethod
    @transaction.atomic
    def advance_winner(tournament_match, winner_participant):
        tmatch = tournament_match
        tmatch.winner = winner_participant
        tmatch.status = 'completed'
        tmatch.completed_at = timezone.now()
        tmatch.save()

        # Find next match in knockout bracket
        next_round = tmatch.round_number + 1
        if tmatch.round_type == 'play_in':
            # For play-in (round 0), winner goes to round 1.
            # We determine the exact match and player slot using the unified slot assignment:
            total_players = TournamentParticipant.objects.filter(tournament=tmatch.tournament).count()
            target_players, playin_count = KnockoutService.calculate_play_in_rounds(total_players)
            rest_count = total_players - 2 * playin_count
            
            slot_idx = rest_count + tmatch.match_order - 1
            next_match_order = (slot_idx // 2) + 1
            is_player2 = (slot_idx % 2 == 1)
            next_round = 1
            
            try:
                next_match = TournamentMatch.objects.get(
                    tournament=tmatch.tournament,
                    round_type='knockout',
                    round_number=next_round,
                    match_order=next_match_order
                )
            except TournamentMatch.DoesNotExist:
                # Should not happen
                return
                
            if is_player2:
                next_match.player2 = winner_participant
            else:
                next_match.player1 = winner_participant
            next_match.save()
        else:
            next_match_order = (tmatch.match_order + 1) // 2
            try:
                next_match = TournamentMatch.objects.get(
                    tournament=tmatch.tournament,
                    round_type='knockout',
                    round_number=next_round,
                    match_order=next_match_order
                )
            except TournamentMatch.DoesNotExist:
                # Tournament finished – assign ranks
                KnockoutService.assign_ranks(tmatch.tournament, winner_participant)
                return

            if next_match.player1 is None:
                next_match.player1 = winner_participant
            elif next_match.player2 is None:
                next_match.player2 = winner_participant
            else:
                # Should not happen
                return
            next_match.save()

        # Check and start bot matches
        KnockoutService.check_and_start_bot_matches(tmatch.tournament)

    @staticmethod
    def assign_ranks(tournament, champion_participant):
        """Assign final ranks to all participants based on elimination order."""
        import math
        participants = TournamentParticipant.objects.filter(tournament=tournament)
        total_players = participants.count()
        target_players, playin_count = KnockoutService.calculate_play_in_rounds(total_players)
        total_rounds = int(math.log2(target_players)) if target_players > 1 else 1
        
        for p in participants:
            if p == champion_participant:
                p.current_rank = 1
            else:
                # Find the match where this participant lost
                lost_match = TournamentMatch.objects.filter(
                    tournament=tournament,
                    winner__isnull=False,
                    status='completed'
                ).exclude(winner=p).filter(models.Q(player1=p) | models.Q(player2=p)).first()
                if lost_match:
                    if lost_match.round_type == 'play_in':
                        p.current_rank = total_players
                    else:
                        p.current_rank = total_rounds - lost_match.round_number + 2
                else:
                    p.current_rank = total_players
            p.save()
        # Distribute prizes based on prize_distribution
        KnockoutService.distribute_prizes(tournament)

        # Mark tournament as completed
        tournament.status = 'completed'
        tournament.completed_at = timezone.now()
        tournament.save(update_fields=['status', 'completed_at'])

    @staticmethod
    def distribute_prizes(tournament):
        """Payout using prize_distribution JSON or fall back to default percentages from tournament system.md."""
        participants = TournamentParticipant.objects.filter(tournament=tournament).order_by('current_rank')
        
        if tournament.prize_distribution:
            prize_map = tournament.prize_distribution
        else:
            pool = Decimal(str(tournament.prize_pool))
            prize_map = {
                "1": str(pool * Decimal("0.40")),
                "2": str(pool * Decimal("0.25")),
                "3": str(pool * Decimal("0.15")),
                "4": str(pool * Decimal("0.12")),
                "5": str(pool * Decimal("0.08")),
            }

        for idx, participant in enumerate(participants, start=1):
            rank_str = str(idx)
            # Handle ranges like "5-6"
            prize = None
            if rank_str in prize_map:
                prize = Decimal(str(prize_map[rank_str]))
            else:
                for key, value in prize_map.items():
                    if '-' in key:
                        start, end = map(int, key.split('-'))
                        if start <= idx <= end:
                            prize = Decimal(str(value))
                            break
            if prize and prize > 0:
                WalletService.payout_win(participant.user, prize, str(tournament.id))

    @staticmethod
    def check_and_start_bot_matches(tournament):
        from .models import TournamentMatch
        
        # 1. Start pending bot-only matches
        pending_matches = TournamentMatch.objects.filter(
            tournament=tournament,
            status='pending',
            player1__isnull=False,
            player2__isnull=False
        )
        
        for tmatch in pending_matches:
            p1_username = tmatch.player1.user.username
            p2_username = tmatch.player2.user.username
            if p1_username.startswith('bot_') and p2_username.startswith('bot_'):
                try:
                    TournamentService.start_match(tmatch.id)
                except Exception as e:
                    print(f"Error auto-starting bot match {tmatch.id}: {e}")

        # 2. Resume active bot-only matches that may have lost their threads
        active_matches = TournamentMatch.objects.select_related('player1__user', 'player2__user').filter(
            tournament=tournament,
            status='active',
            match_id__isnull=False
        )
        for tmatch in active_matches:
            p1_username = tmatch.player1.user.username if tmatch.player1 else ''
            p2_username = tmatch.player2.user.username if tmatch.player2 else ''
            if p1_username.startswith('bot_') and p2_username.startswith('bot_'):
                from apps.matches.models import Match
                from apps.matches.services import trigger_bot_move_async
                try:
                    match = Match.objects.get(id=tmatch.match_id)
                    if match.status == 'active':
                        trigger_bot_move_async(match)
                except Match.DoesNotExist:
                    pass


class SwissService:
    """Swiss stage for Swiss Hybrid tournaments."""

    @staticmethod
    @transaction.atomic
    def generate_swiss_pairings(tournament, round_number):
        """Pair participants with same or similar swiss_points."""
        participants = list(TournamentParticipant.objects.filter(
            tournament=tournament, is_eliminated=False
        ).order_by('-swiss_points', 'swiss_game_diff'))
        paired = set()
        matches = []
        for i, p1 in enumerate(participants):
            if p1.id in paired:
                continue
            # Find opponent with closest swiss_points not yet paired
            p2 = None
            for j, p2_candidate in enumerate(participants):
                if p2_candidate.id != p1.id and p2_candidate.id not in paired:
                    if p2 is None or abs(p2_candidate.swiss_points - p1.swiss_points) < abs(p2.swiss_points - p1.swiss_points):
                        p2 = p2_candidate
            if p2:
                paired.add(p1.id)
                paired.add(p2.id)
                # Create TournamentMatch for this Swiss round
                tmatch = TournamentMatch.objects.create(
                    tournament=tournament,
                    round_type='swiss',
                    round_number=round_number,
                    match_order=len(matches) + 1,
                    player1=p1,
                    player2=p2,
                    status='pending'
                )
                matches.append(tmatch)
            else:
                # Odd number of players – give bye (points for free)
                p1.swiss_points += 3
                p1.save()
        return matches

    @staticmethod
    @transaction.atomic
    def report_swiss_match_result(tournament_match, winner_participant, player1_score, player2_score):
        tmatch = tournament_match
        loser = tmatch.player2 if winner_participant == tmatch.player1 else tmatch.player1
        # Update scores in match
        tmatch.player1_score = player1_score
        tmatch.player2_score = player2_score
        tmatch.winner = winner_participant
        tmatch.status = 'completed'
        tmatch.completed_at = timezone.now()
        tmatch.save()

        # Update swiss_points (3 for win, 1 for draw? We'll assume no draws in Swiss for simplicity)
        winner_participant.swiss_points += 3
        winner_participant.swiss_game_diff += (player1_score - player2_score) if winner_participant == tmatch.player1 else (player2_score - player1_score)
        winner_participant.save()

        loser.swiss_game_diff += (player2_score - player1_score) if loser == tmatch.player2 else (player1_score - player2_score)
        loser.save()

        # Record SwissRoundScore
        SwissRoundScore.objects.create(
            tournament=tmatch.tournament,
            participant=winner_participant,
            round_number=tmatch.round_number,
            points=3,
            opponent=loser,
            match=tmatch
        )
        SwissRoundScore.objects.create(
            tournament=tmatch.tournament,
            participant=loser,
            round_number=tmatch.round_number,
            points=0,
            opponent=winner_participant,
            match=tmatch
        )

    @staticmethod
    def qualify_for_knockout(tournament):
        """After Swiss rounds, take top `qualification_slots` participants."""
        participants = TournamentParticipant.objects.filter(tournament=tournament).order_by('-swiss_points', '-swiss_game_diff')
        slots = tournament.qualification_slots
        qualified = participants[:slots]
        # Mark them as not eliminated (others as eliminated)
        for p in participants:
            p.is_eliminated = p not in qualified
            p.save()
        # Seed qualified into knockout bracket (round 1)
        # Shuffle? Actually seed by Swiss rank (1 vs last, 2 vs second-last)
        qualified_list = list(qualified)
        # Seed: highest vs lowest
        seeded = []
        while len(qualified_list) > 1:
            seeded.append(qualified_list.pop(0))
            seeded.append(qualified_list.pop())
        if qualified_list:
            seeded.append(qualified_list.pop())
        # Create knockout matches
        round_number = 1
        match_order = 0
        for i in range(0, len(seeded), 2):
            match_order += 1
            TournamentMatch.objects.create(
                tournament=tournament,
                round_type='knockout',
                round_number=round_number,
                match_order=match_order,
                player1=seeded[i],
                player2=seeded[i+1] if i+1 < len(seeded) else None,
                status='pending'
            )
        tournament.status = 'in_progress'  # knockout stage now
        tournament.save()


class TournamentService:
    """Main service orchestrating both knockout and Swiss hybrid."""

    @staticmethod
    def list_active_tournaments():
        return Tournament.objects.filter(status__in=['registering', 'in_progress', 'completed'])

    @staticmethod
    @transaction.atomic
    def create_tournament(created_by, name, game_type, entry_fee, max_players=8,
                          bracket_type='single_elimination', tournament_type='knockout',
                          swiss_rounds=0, qualification_slots=0, prize_distribution=None):
        if tournament_type == 'knockout':
            # For knockout, ensure max_players is an integer, but play‑in will handle any number
            pass
        tournament = Tournament.objects.create(
            created_by=created_by,
            name=name,
            game_type=game_type,
            entry_fee=Decimal(str(entry_fee)),
            max_players=max_players,
            bracket_type=bracket_type,
            tournament_type=tournament_type,
            swiss_rounds=swiss_rounds,
            qualification_slots=qualification_slots,
            prize_distribution=prize_distribution or {},
        )
        return tournament

    @staticmethod
    @transaction.atomic
    def register_user(tournament_id, user):
        tournament = Tournament.objects.select_for_update().get(id=tournament_id)
        if tournament.status != 'registering':
            raise ValueError("Tournament not accepting registrations")
        if tournament.current_players >= tournament.max_players:
            raise ValueError("Tournament is full")
        if TournamentParticipant.objects.filter(tournament=tournament, user=user).exists():
            raise ValueError("Already registered")
        if tournament.entry_fee > 0:
            WalletService.lock_funds(user, tournament.entry_fee)
        TournamentParticipant.objects.create(tournament=tournament, user=user)
        tournament.current_players += 1
        tournament.prize_pool += tournament.entry_fee
        tournament.save(update_fields=['current_players', 'prize_pool'])
        # Auto-start if full
        if tournament.current_players == tournament.max_players:
            TournamentService.start_tournament(tournament.id)
        return True

    @staticmethod
    @transaction.atomic
    def start_tournament(tournament_id):
        tournament = Tournament.objects.select_for_update().get(id=tournament_id)
        if tournament.status != 'registering':
            return
        if tournament.current_players < 2:
            raise ValueError("Not enough players")

        # Deduct locked entry fees since the tournament is starting
        if tournament.entry_fee > 0:
            for participant in tournament.participants.all():
                WalletService.consume_entry_fee(participant.user, tournament.entry_fee, tournament.id)

        if tournament.tournament_type == 'knockout':
            KnockoutService.generate_bracket(tournament)
            tournament.status = 'in_progress'
            tournament.started_at = timezone.now()
            tournament.save(update_fields=['status', 'started_at'])
        elif tournament.tournament_type == 'swiss_hybrid':
            if tournament.swiss_rounds <= 0 or tournament.qualification_slots <= 0:
                raise ValueError("Swiss rounds and qualification slots must be set for hybrid tournament")
            tournament.status = 'in_progress'
            tournament.current_swiss_round = 1
            tournament.started_at = timezone.now()
            tournament.save(update_fields=['status', 'current_swiss_round', 'started_at'])
            # Generate first Swiss round pairings
            SwissService.generate_swiss_pairings(tournament, 1)
        else:
            raise ValueError("Unknown tournament type")
        cache.delete(f'tournament_bracket_{tournament.id}')

    @staticmethod
    def get_bracket(tournament_id):
        tournament = Tournament.objects.get(id=tournament_id)
        KnockoutService.check_and_start_bot_matches(tournament)

        cache_key = f'tournament_bracket_{tournament_id}'
        bracket = cache.get(cache_key)
        if bracket is None:
            matches = TournamentMatch.objects.filter(tournament=tournament).order_by('round_number', 'match_order')
            bracket = {
                'tournament_id': str(tournament.id),
                'name': tournament.name,
                'status': tournament.status,
                'tournament_type': tournament.tournament_type,
                'max_players': tournament.max_players,
                'current_players': tournament.current_players,
                'entry_fee': float(tournament.entry_fee),
                'prize_pool': float(tournament.prize_pool),
                'prize_distribution': tournament.prize_distribution,
                'swiss_rounds': tournament.swiss_rounds,
                'current_swiss_round': tournament.current_swiss_round,
                'qualification_slots': tournament.qualification_slots,
                'rounds': []
            }
            rounds = {}
            for m in matches:
                key = f"{m.round_type}_{m.round_number}"
                rounds.setdefault(key, []).append({
                    'id': m.id,
                    'round_type': m.round_type,
                    'round_number': m.round_number,
                    'player1': m.player1.user.username if m.player1 else None,
                    'player1_id': str(m.player1.user.id) if m.player1 else None,
                    'player2': m.player2.user.username if m.player2 else None,
                    'player2_id': str(m.player2.user.id) if m.player2 else None,
                    'winner': m.winner.user.username if m.winner else None,
                    'status': m.status,
                    'match_id': m.match_id,
                    'player1_score': m.player1_score,
                    'player2_score': m.player2_score,
                })
            for k in sorted(rounds.keys()):
                bracket['rounds'].append({'name': k, 'matches': rounds[k]})
            cache.set(cache_key, bracket, 60)
        return bracket

    @staticmethod
    @transaction.atomic
    def start_match(tournament_match_id):
        tmatch = TournamentMatch.objects.select_related('tournament', 'player1__user', 'player2__user').get(id=tournament_match_id)
        if tmatch.status == 'active':
            if tmatch.match_id:
                from apps.matches.models import Match
                try:
                    match = Match.objects.get(id=tmatch.match_id)
                    return match
                except Match.DoesNotExist:
                    pass
        elif tmatch.status == 'completed':
            raise ValueError("Match already completed")

        if not tmatch.player1 or not tmatch.player2:
            raise ValueError("Missing players")

        from apps.matches.services import create_match, join_match, create_series

        import math
        total_rounds = int(math.log2(tmatch.tournament.max_players)) if tmatch.tournament.max_players > 1 else 1
        is_final = (tmatch.round_number == total_rounds)

        if tmatch.tournament.game_type == 'tictactoe':
            series, match = create_series(
                player1_id=tmatch.player1.user.id,
                player2_id=tmatch.player2.user.id,
                game_type='tictactoe',
                stake=0
            )
            # Inject tournament flags
            match.game_state['isTournament'] = True
            match.game_state['tournamentId'] = str(tmatch.tournament.id)
            match.game_state['tournamentRoundNumber'] = tmatch.round_number
            match.game_state['isTournamentFinal'] = is_final
            match.save(update_fields=['game_state'])
        else:
            match = create_match(
                player1_id=tmatch.player1.user.id,
                game_type=tmatch.tournament.game_type,
                stake=0
            )
            # Inject tournament flags before player 2 joins
            match.game_state['isTournament'] = True
            match.game_state['tournamentId'] = str(tmatch.tournament.id)
            match.game_state['tournamentRoundNumber'] = tmatch.round_number
            match.game_state['isTournamentFinal'] = is_final
            match.save(update_fields=['game_state'])
            join_match(match.id, tmatch.player2.user.id)

        tmatch.match_id = str(match.id)
        tmatch.status = 'active'
        tmatch.save(update_fields=['match_id', 'status'])
        cache.delete(f'tournament_bracket_{tmatch.tournament.id}')
        return match

    @staticmethod
    @transaction.atomic
    def report_match_result(tournament_match_id, winner_participant_id, player1_score=0, player2_score=0):
        tmatch = TournamentMatch.objects.select_for_update().get(id=tournament_match_id)
        if tmatch.status != 'active':
            raise ValueError("Match not active")
        winner = TournamentParticipant.objects.get(id=winner_participant_id)
        if winner not in [tmatch.player1, tmatch.player2]:
            raise ValueError("Winner not in this match")

        # Handle based on round_type
        if tmatch.round_type == 'swiss':
            SwissService.report_swiss_match_result(tmatch, winner, player1_score, player2_score)
            # Check if Swiss stage completed
            tournament = tmatch.tournament
            if tournament.current_swiss_round < tournament.swiss_rounds:
                tournament.current_swiss_round += 1
                tournament.save(update_fields=['current_swiss_round'])
                SwissService.generate_swiss_pairings(tournament, tournament.current_swiss_round)
            else:
                # Swiss stage finished – proceed to knockout qualification
                SwissService.qualify_for_knockout(tournament)
        else:
            # Knockout or play‑in
            KnockoutService.advance_winner(tmatch, winner)

        cache.delete(f'tournament_bracket_{tmatch.tournament.id}')
        return tmatch