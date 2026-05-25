# pureplay-main/backend/apps/rankings/services.py

from django.db import transaction
from django.utils import timezone
from .models import PlayerStats, MatchHistory

class RankingService:
    
    @staticmethod
    def get_or_create_stats(user, game_type='tictactoe'):
        stats, _ = PlayerStats.objects.get_or_create(user=user, game_type=game_type)
        return stats
    
    @staticmethod
    def calculate_xp_gain(winner_stats, loser_stats, is_draw=False):
        """Official XP gains: win +50, draw +25, loss +15."""
        if is_draw:
            return 25, 25
        # Winner base XP
        winner_xp = 50
        # Add streak bonus if applicable
        streak = winner_stats.current_streak + 1  # will become new streak after win
        if streak >= 10:
            winner_xp += 120
        elif streak >= 5:
            winner_xp += 50
        elif streak >= 3:
            winner_xp += 20
        loser_xp = 15
        return winner_xp, loser_xp
    
    @staticmethod
    def calculate_elo_change(winner_mmr, loser_mmr, k_factor=32):
        expected_winner = 1 / (1 + 10 ** ((loser_mmr - winner_mmr) / 400))
        expected_loser = 1 - expected_winner
        winner_change = round(k_factor * (1 - expected_winner))
        loser_change = round(k_factor * (0 - expected_loser))
        return winner_change, loser_change
    
    @staticmethod
    @transaction.atomic
    def update_after_match(match_id, winner_user, loser_user, is_draw=False):
        from apps.matches.models import Match
        match = Match.objects.get(id=match_id)
        game_type = match.game_state.get('gameType', 'tictactoe')
        
        winner_stats = RankingService.get_or_create_stats(winner_user, game_type) if winner_user else None
        loser_stats = RankingService.get_or_create_stats(loser_user, game_type) if loser_user else None
        
        if is_draw:
            # Both get 25 XP, no streak changes, small Elo change
            winner_xp, loser_xp = 25, 25
            # Elo change for draw: both get 0? Or small? We'll keep 0 for simplicity.
            winner_mmr_change, loser_mmr_change = 0, 0
        else:
            # Calculate XP including streak bonuses (using current streak before update)
            winner_xp, loser_xp = RankingService.calculate_xp_gain(winner_stats, loser_stats)
            # Elo change
            winner_mmr_change, loser_mmr_change = RankingService.calculate_elo_change(
                winner_stats.mmr, loser_stats.mmr
            )
        
        # Update winner
        if winner_stats and not is_draw:
            winner_stats.wins += 1
            winner_stats.current_streak += 1
            winner_stats.longest_streak = max(winner_stats.longest_streak, winner_stats.current_streak)
            winner_stats.mmr += winner_mmr_change
            winner_stats.xp += winner_xp
            winner_stats.last_match_at = timezone.now()
            winner_stats.total_matches += 1
            winner_stats.save()
        
        # Update loser
        if loser_stats and not is_draw:
            loser_stats.losses += 1
            loser_stats.current_streak = 0
            loser_stats.mmr += loser_mmr_change  # negative
            loser_stats.xp += loser_xp
            loser_stats.last_match_at = timezone.now()
            loser_stats.total_matches += 1
            loser_stats.save()
        
        if is_draw:
            for stats in [winner_stats, loser_stats]:
                if stats:
                    stats.draws += 1
                    stats.total_matches += 1
                    stats.last_match_at = timezone.now()
                    stats.save()
        
        # Create match history record
        MatchHistory.objects.create(
            match=match,
            game_type=game_type,
            player1=match.player1,
            player2=match.player2,
            winner=winner_user if not is_draw else None,
            player1_mmr_before=RankingService.get_or_create_stats(match.player1, game_type).mmr,
            player2_mmr_before=RankingService.get_or_create_stats(match.player2, game_type).mmr,
            player1_mmr_change=winner_mmr_change if match.player1 == winner_user else loser_mmr_change,
            player2_mmr_change=winner_mmr_change if match.player2 == winner_user else loser_mmr_change,
            player1_xp_gain=winner_xp if match.player1 == winner_user else loser_xp,
            player2_xp_gain=winner_xp if match.player2 == winner_user else loser_xp,
        )
    
    @staticmethod
    def add_tournament_xp(user, placement, game_type='tictactoe', tournament_id=None):
        """Add XP for tournament placement (1st, 2nd, 3rd, Top16, Top64, participation)."""
        placement_map = {
            '1st': 1000,
            '2nd': 700,
            '3rd': 500,
            'top16': 250,
            'top64': 100,
            'participation': 30,
        }
        xp_gain = placement_map.get(placement, 30)
        stats = RankingService.get_or_create_stats(user, game_type)
        stats.xp += xp_gain
        stats.save(update_fields=['xp'])
        # Optionally record a transaction for tournament XP
        return xp_gain
    
    @staticmethod
    def get_leaderboard(game_type='tictactoe', sort_by='mmr', limit=50):
        """Return top players by mmr or xp."""
        if sort_by == 'mmr':
            queryset = PlayerStats.objects.filter(game_type=game_type).order_by('-mmr')[:limit]
        elif sort_by == 'xp':
            queryset = PlayerStats.objects.filter(game_type=game_type).order_by('-xp')[:limit]
        else:
            queryset = PlayerStats.objects.filter(game_type=game_type).order_by('-mmr')[:limit]
        return [
            {
                'rank': idx + 1,
                'username': stat.user.username,
                'mmr': stat.mmr,
                'xp': stat.xp,
                'rank_tier': stat.rank_tier,
                'next_tier_xp': stat.next_tier_xp,
                'wins': stat.wins,
                'losses': stat.losses,
                'win_rate': round(stat.wins / max(stat.total_matches, 1) * 100, 1),
                'current_streak': stat.current_streak,
                'longest_streak': stat.longest_streak,
            }
            for idx, stat in enumerate(queryset)
        ]