import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from apps.tournaments.models import Tournament, TournamentParticipant, TournamentMatch
from apps.tournaments.services import TournamentService

User = get_user_model()

# 1. Clean up old active tournaments
Tournament.objects.filter(status__in=['registering', 'in_progress']).delete()
print("Removed old active/registering tournaments")

# 2. Get or create test users and set passwords to pureplaypass123
users_to_register = ["clas6", "clas5", "clas66", "cla4", "smoke1779442567", "p11779442578", "p21779442578", "bot_1"]
all_users = []

for username in users_to_register:
    u, _ = User.objects.get_or_create(username=username, defaults={'email': f"{username}@pureplay.com"})
    u.set_password("pureplaypass123")
    u.save()
    all_users.append(u)

# 3. Create tournament
active_user = all_users[0]
tournament = TournamentService.create_tournament(
    created_by=active_user,
    name="Tic Tac Toe Championship",
    game_type="tictactoe",
    entry_fee=0,
    max_players=8,
    bracket_type="single_elimination",
    tournament_type="knockout",
    prize_distribution={"1": 1000, "2": 500}
)
print(f"Created tournament: {tournament.name} ({tournament.id})")

# 4. Register all 8 players
for p in all_users:
    TournamentService.register_user(tournament.id, p)

print("Registered all 8 users and generated tournament bracket")

# 5. Deterministically match candidate user pairs in Round 1
parts = {
    username: TournamentParticipant.objects.get(tournament=tournament, user__username=username)
    for username in users_to_register
}

# Update Round 1 matches
m1 = TournamentMatch.objects.get(tournament=tournament, round_number=1, match_order=1)
m1.player1 = parts["clas6"]
m1.player2 = parts["clas5"]
m1.save()

m2 = TournamentMatch.objects.get(tournament=tournament, round_number=1, match_order=2)
m2.player1 = parts["clas66"]
m2.player2 = parts["cla4"]
m2.save()

m3 = TournamentMatch.objects.get(tournament=tournament, round_number=1, match_order=3)
m3.player1 = parts["smoke1779442567"]
m3.player2 = parts["p11779442578"]
m3.save()

m4 = TournamentMatch.objects.get(tournament=tournament, round_number=1, match_order=4)
m4.player1 = parts["p21779442578"]
m4.player2 = parts["bot_1"]
m4.save()

print("\nDeterministic Round 1 Matches:")
print(f"Match 1: {m1.player1.user.username} vs {m1.player2.user.username}")
print(f"Match 2: {m2.player1.user.username} vs {m2.player2.user.username}")
print(f"Match 3: {m3.player1.user.username} vs {m3.player2.user.username}")
print(f"Match 4: {m4.player1.user.username} vs {m4.player2.user.username}")
print("\nTournament configured successfully!")
