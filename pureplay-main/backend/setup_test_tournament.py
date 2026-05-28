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

# 2. Get or create test users
user1, _ = User.objects.get_or_create(username="smoke1779442567", defaults={'email': "smoke@pureplay.com"})
user1.set_password("pureplaypass123")
user1.save()

user2, _ = User.objects.get_or_create(username="p11779442578", defaults={'email': "p1@pureplay.com"})
user2.set_password("pureplaypass123")
user2.save()

other_users = []
for username in ["p21779442578", "bot_1", "bot_2", "bot_3", "bot_4", "bot_5"]:
    u, _ = User.objects.get_or_create(username=username, defaults={'email': f"{username}@pureplay.com"})
    u.set_password("pureplaypass123")
    u.save()
    other_users.append(u)

# 3. Create tournament
active_user = user1
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
all_players = [user1, user2] + other_users
for p in all_players:
    TournamentService.register_user(tournament.id, p)

print("Registered all 8 users and generated tournament bracket")

# 5. Deterministically match user1 against user2 in Match 1
# Fetch participants
part1 = TournamentParticipant.objects.get(tournament=tournament, user=user1)
part2 = TournamentParticipant.objects.get(tournament=tournament, user=user2)
part3 = TournamentParticipant.objects.get(tournament=tournament, user=other_users[0])
part_bot1 = TournamentParticipant.objects.get(tournament=tournament, user=other_users[1])
part_bot2 = TournamentParticipant.objects.get(tournament=tournament, user=other_users[2])
part_bot3 = TournamentParticipant.objects.get(tournament=tournament, user=other_users[3])
part_bot4 = TournamentParticipant.objects.get(tournament=tournament, user=other_users[4])
part_bot5 = TournamentParticipant.objects.get(tournament=tournament, user=other_users[5])

# Update Round 1 matches
m1 = TournamentMatch.objects.get(tournament=tournament, round_number=1, match_order=1)
m1.player1 = part1
m1.player2 = part2
m1.save()

m2 = TournamentMatch.objects.get(tournament=tournament, round_number=1, match_order=2)
m2.player1 = part3
m2.player2 = part_bot1
m2.save()

m3 = TournamentMatch.objects.get(tournament=tournament, round_number=1, match_order=3)
m3.player1 = part_bot2
m3.player2 = part_bot3
m3.save()

m4 = TournamentMatch.objects.get(tournament=tournament, round_number=1, match_order=4)
m4.player1 = part_bot4
m4.player2 = part_bot5
m4.save()

print("\nUpdated Round 1 Matches:")
print(f"Match 1: {m1.player1.user.username} vs {m1.player2.user.username}")
print(f"Match 2: {m2.player1.user.username} vs {m2.player2.user.username}")
print(f"Match 3: {m3.player1.user.username} vs {m3.player2.user.username}")
print(f"Match 4: {m4.player1.user.username} vs {m4.player2.user.username}")
print("\nDeterministic tournament ready for two-tab testing!")
