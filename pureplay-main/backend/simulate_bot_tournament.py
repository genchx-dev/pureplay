# simulate_bot_tournament.py

import os
import django
import random
import time
import sys

# 1. Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from apps.tournaments.models import Tournament, TournamentParticipant, TournamentMatch
from apps.tournaments.services import TournamentService
from apps.matches.models import Match
from apps.matches.services import make_move

User = get_user_model()

def setup_and_run_simulation():
    print("[Simulation] Cleaning up old 'Spectator Arena Cup' tournaments...")
    Tournament.objects.filter(name="Spectator Arena Cup").delete()

    print("[Simulation] Creating 8 bot players...")
    bots = []
    for i in range(1, 9):
        username = f"bot_{i}"
        bot_user, created = User.objects.get_or_create(
            username=username,
            defaults={'email': f"{username}@pureplay.com"}
        )
        bot_user.set_password("password123")
        bot_user.save()
        bots.append(bot_user)
        print(f"  - Bot: {username} (Created: {created})")

    # Ensure admin user is also present just in case
    admin_user = User.objects.filter(is_staff=True).first()
    creator = admin_user if admin_user else bots[0]

    print(f"[Simulation] Creating tournament 'Spectator Arena Cup'...")
    tournament = TournamentService.create_tournament(
        created_by=creator,
        name="Spectator Arena Cup",
        game_type="tictactoe",
        entry_fee=0,
        max_players=8,
        bracket_type="single_elimination",
        tournament_type="knockout",
        prize_distribution={"1": 1000, "2": 500}
    )
    print(f"Tournament created with ID: {tournament.id}")

    print("[Simulation] Registering all 8 bots...")
    for bot in bots:
        TournamentService.register_user(tournament.id, bot)

    # Refresh status
    tournament.refresh_from_db()
    print(f"[Simulation] Tournament status: {tournament.status} (Expected: in_progress)")

    print("\n" + "="*50)
    print("TOURNAMENT STARTED SUCCESSFULLY!")
    print("Go to your browser -> Login as admin -> Go to /admin -> Tournaments")
    print("You will see 'Spectator Arena Cup' is Live!")
    print("Open its Live Bracket, click 'Spectate' on any match to watch it live.")
    print("="*50 + "\n")

    # Loop to simulate matches
    while True:
        tournament.refresh_from_db()
        if tournament.status == 'completed':
            champion = TournamentParticipant.objects.filter(tournament=tournament, current_rank=1).first()
            champion_name = champion.user.username if champion else 'Unknown'
            print(f"\n[Simulation] Tournament Completed! Champion is: {champion_name}")
            break

        if tournament.status == 'cancelled':
            print("\n[Simulation] Tournament was cancelled.")
            break

        # Fetch non-completed tournament matches
        tmatches = TournamentMatch.objects.filter(
            tournament=tournament
        ).exclude(status='completed')

        if not tmatches.exists():
            print("[Simulation] Waiting for next round pairings...")
            time.sleep(2)
            continue

        active_game_played = False

        for tmatch in tmatches:
            # 1. If match is pending and has both players ready, start it
            if tmatch.status == 'pending':
                if tmatch.player1 and tmatch.player2:
                    print(f"[Simulation] Starting Match: {tmatch.player1.user.username} vs {tmatch.player2.user.username} (Round {tmatch.round_number})")
                    TournamentService.start_match(tmatch.id)
                    tmatch.refresh_from_db()
                else:
                    # Still waiting for opponent to advance
                    continue

            # 2. If match is active, make a move in the game
            if tmatch.status == 'active' and tmatch.match_id:
                try:
                    match_obj = Match.objects.get(id=tmatch.match_id)
                except Match.DoesNotExist:
                    print(f"[Simulation] Warning: Match {tmatch.match_id} object not found in database.")
                    continue

                if match_obj.status == 'active':
                    game_state = match_obj.game_state
                    board = game_state.get('board', [])
                    current_player_symbol = game_state.get('currentPlayer')
                    players = game_state.get('players', {})
                    current_player_id = players.get(current_player_symbol)

                    if current_player_id is not None:
                        # Find open spots
                        open_cells = [i for i, cell in enumerate(board) if cell is None]
                        if open_cells:
                            move = random.choice(open_cells)
                            print(f"[Simulation] Match {str(match_obj.id)}... - {match_obj.player1.username} vs {match_obj.player2.username}: Turn of {current_player_symbol} ({current_player_id}) -> Move to index {move}")
                            try:
                                make_move(match_obj.id, current_player_id, move)
                                active_game_played = True
                            except Exception as e:
                                print(f"[Simulation] Error applying move: {e}")
                        else:
                            print(f"[Simulation] Match {str(match_obj.id)} has no moves left but is still marked active.")

        # Sleep between turns to make it realistic and viewable
        if active_game_played:
            time.sleep(4)
        else:
            time.sleep(2)

if __name__ == '__main__':
    setup_and_run_simulation()
