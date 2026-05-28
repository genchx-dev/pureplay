import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.tournaments.models import TournamentMatch
from apps.matches.models import Match

print("Active matches:")
for m in Match.objects.filter(status='active'):
    print(f"- Match ID: {m.id}, Player1: {m.player1.username}, Player2: {m.player2.username if m.player2 else None}, Game: {m.game_state.get('gameType')}")

print("\nActive tournament matches:")
for tm in TournamentMatch.objects.filter(status='active'):
    p1 = tm.player1.user.username if tm.player1 else "None"
    p2 = tm.player2.user.username if tm.player2 else "None"
    print(f"- Tournament Match ID: {tm.id}, Player1: {p1}, Player2: {p2}, Match ID: {tm.match_id}")
