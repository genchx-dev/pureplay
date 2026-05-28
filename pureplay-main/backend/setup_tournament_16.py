import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from apps.tournaments.models import Tournament
from apps.tournaments.services import TournamentService

User = get_user_model()

# 1. Clean up old active tournaments
Tournament.objects.filter(status__in=['registering', 'in_progress']).delete()
print("Removed old active/registering tournaments")

# 2. Setup the only human users we want for testing
human_usernames = ['clas6', 'clas5']
non_bot_users = []
for username in human_usernames:
    try:
        u = User.objects.get(username=username)
        non_bot_users.append(u)
    except User.DoesNotExist:
        print(f"Warning: human user {username} does not exist in the database.")

if not non_bot_users:
    # Fallback to any non-bot user if none of the test accounts exist
    fallback = User.objects.exclude(username__startswith='bot_').first()
    if fallback:
        non_bot_users = [fallback]
        print(f"Fallback: registered human user {fallback.username}")

print(f"Registering human users: {[u.username for u in non_bot_users]}")

# 3. Create a 16-player tournament
active_user = non_bot_users[0]
tournament = TournamentService.create_tournament(
    created_by=active_user,
    name="Tic Tac Toe Championship",
    game_type="tictactoe",
    entry_fee=0,
    max_players=16,
    bracket_type="single_elimination",
    tournament_type="knockout",
    prize_distribution={"1": 1000, "2": 500}
)
print(f"Created tournament: {tournament.name} ({tournament.id})")

# 4. Register all test human users
for u in non_bot_users:
    TournamentService.register_user(tournament.id, u)
    print(f"Registered user: {u.username}")

# 5. Register bots to fill up to 16 players
current_players_count = len(non_bot_users)
bots_needed = 16 - current_players_count

for i in range(1, bots_needed + 1):
    username = f"bot_{i}"
    email = f"bot_{i}@pureplay.com"
    bot, created = User.objects.get_or_create(username=username, defaults={'email': email})
    if created:
        bot.set_password("pureplaypass123")
        bot.save()
    TournamentService.register_user(tournament.id, bot)
    print(f"Registered bot: {bot.username}")

# 6. Force pairings for testing:
# Match 1: clas6 vs bot_1 (or fallback human vs bot_1)
# Match 2: bot_2 vs bot_3 (bot vs bot)
# Match 3: bot_4 vs bot_5 (bot vs bot)
# Match 4: clas5 vs bot_6 (if clas5 is registered, otherwise bot_6 vs bot_7)
# Match 5 to 8: bot vs bot pairings for all remaining participants
from apps.tournaments.models import TournamentMatch, TournamentParticipant
from apps.tournaments.services import KnockoutService

# Delete all generated matches to avoid mismatch between database TournamentMatch and initially created Match objects
TournamentMatch.objects.filter(tournament=tournament).delete()
print("Deleted initial auto-generated matches.")

participants = {p.user.username: p for p in TournamentParticipant.objects.filter(tournament=tournament)}

# Round 1 pairings
h1 = non_bot_users[0].username
h2 = non_bot_users[1].username if len(non_bot_users) >= 2 else None

r1_pairings = [
    (h1, 'bot_1'),
    ('bot_2', 'bot_3'),
    ('bot_4', 'bot_5'),
    (h2 if h2 else 'bot_6', 'bot_6' if not h2 else 'bot_6'),
    ('bot_7', 'bot_8'),
    ('bot_9', 'bot_10'),
    ('bot_11', 'bot_12'),
    ('bot_13', 'bot_14'),
]

# If h2 wasn't registered, we have bot_6 vs bot_7, and remaining_bots is different
if not h2:
    r1_pairings[3] = ('bot_6', 'bot_7')
    r1_pairings[4] = ('bot_8', 'bot_9')
    r1_pairings[5] = ('bot_10', 'bot_11')
    r1_pairings[6] = ('bot_12', 'bot_13')
    r1_pairings[7] = ('bot_14', 'bot_15') # since we have 15 bots

for idx, (p1_user, p2_user) in enumerate(r1_pairings):
    TournamentMatch.objects.create(
        tournament=tournament,
        round_type='knockout',
        round_number=1,
        match_order=idx + 1,
        player1=participants[p1_user],
        player2=participants[p2_user],
        status='pending'
    )
print("Created Round 1 matches with clean pairings.")

# Round 2: 4 matches (match_order 1 to 4)
for i in range(1, 5):
    TournamentMatch.objects.create(
        tournament=tournament,
        round_type='knockout',
        round_number=2,
        match_order=i,
        player1=None,
        player2=None,
        status='pending'
    )

# Round 3: 2 matches (match_order 1 to 2)
for i in range(1, 3):
    TournamentMatch.objects.create(
        tournament=tournament,
        round_type='knockout',
        round_number=3,
        match_order=i,
        player1=None,
        player2=None,
        status='pending'
    )

# Round 4: 1 match (match_order 1)
TournamentMatch.objects.create(
    tournament=tournament,
    round_type='knockout',
    round_number=4,
    match_order=1,
    player1=None,
    player2=None,
    status='pending'
)
print("Created Round 2, 3, and 4 matches.")

# Now trigger the bot matches check to start bot-only Round 1 matches
KnockoutService.check_and_start_bot_matches(tournament)
print("Triggered bot vs bot matches starting check.")

print("16-player Tournament setup completed and bracket generated successfully!")

