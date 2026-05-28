# pureplay-main/backend/test_imperfect_bracket.py

import os
import django
import sys

# Setup Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from apps.tournaments.models import Tournament, TournamentParticipant, TournamentMatch
from apps.tournaments.services import TournamentService, KnockoutService

User = get_user_model()

def clean_database():
    print("[Clean] Cleaning old test data...")
    Tournament.objects.all().delete()
    User.objects.filter(username__startswith='imperfect_').delete()
    print("[Clean] Database cleaned.")

def run_verification():
    clean_database()
    
    print("\n--- Seeding 5 Players (Imperfect Bracket) ---")
    users = []
    for i in range(1, 6):
        u = User.objects.create_user(username=f'imperfect_u{i}', email=f'imperfect_u{i}@pureplay.com', password='password123')
        users.append(u)
        
    # Create tournament (max_players = 8 but we will start it with 5)
    tournament = TournamentService.create_tournament(
        created_by=users[0],
        name="Tic Tac Toe Imperfect 5-Player Cup",
        game_type="tictactoe",
        entry_fee=0,
        max_players=8,
        bracket_type="single_elimination",
        tournament_type="knockout"
    )
    
    print(f"Created tournament: {tournament.name}")
    
    # Register 5 players
    for u in users:
        TournamentParticipant.objects.create(tournament=tournament, user=u)
    
    tournament.current_players = 5
    tournament.save()
    print("Registered 5 players manually.")
    
    # Start tournament to generate bracket
    print("Starting tournament...")
    TournamentService.start_tournament(tournament.id)
    
    # Verify matches in DB
    tournament.refresh_from_db()
    assert tournament.status == 'in_progress', f"Expected status 'in_progress', got {tournament.status}"
    
    matches = TournamentMatch.objects.filter(tournament=tournament).order_by('round_number', 'match_order')
    print(f"\nGenerated matches count: {matches.count()}")
    for m in matches:
        print(f"  R{m.round_number} M{m.match_order} ({m.round_type}) | player1: {m.player1.user.username if m.player1 else 'TBD'} | player2: {m.player2.user.username if m.player2 else 'TBD'} | status: {m.status}")
        
    # Assert play-in match exists
    playins = matches.filter(round_type='play_in')
    assert playins.count() == 1, f"Expected 1 play-in match, got {playins.count()}"
    playin_match = playins.first()
    
    # Assert Round 1 matches count is target_players // 2 = 4 // 2 = 2 matches
    r1_matches = matches.filter(round_type='knockout', round_number=1)
    assert r1_matches.count() == 2, f"Expected 2 matches in Round 1, got {r1_matches.count()}"
    
    m1 = r1_matches.filter(match_order=1).first()
    m2 = r1_matches.filter(match_order=2).first()
    
    # Verify pairings in Round 1:
    # Match 1 should be fully populated (two rest players)
    # Match 2 should have one rest player and None/TBD (for play-in winner)
    assert m1.player1 is not None and m1.player2 is not None, "Round 1 Match 1 should have 2 players"
    assert m2.player1 is not None and m2.player2 is None, "Round 1 Match 2 should have 1 player and 1 empty slot for play-in winner"
    
    print("\n--- Simulating Play-in Match Resolution ---")
    playin_match.status = 'active'
    playin_match.save()
    
    # Let's say player1 wins play-in
    winner_playin = playin_match.player1
    TournamentService.report_match_result(
        tournament_match_id=playin_match.id,
        winner_participant_id=winner_playin.id,
        player1_score=2,
        player2_score=1
    )
    
    # Verify that the play-in winner advanced to Round 1, Match 2
    m2.refresh_from_db()
    print(f"Play-in winner ({winner_playin.user.username}) advanced to Round 1 Match 2.")
    print(f"Round 1 Match 2 now: player1={m2.player1.user.username if m2.player1 else 'None'} vs player2={m2.player2.user.username if m2.player2 else 'None'} | status={m2.status}")
    assert m2.player2 == winner_playin, f"Expected play-in winner to be player2 of Round 1 Match 2, got {m2.player2}"
    
    print("\n--- Simulating Round 1 Match Resolutions ---")
    m1.status = 'active'
    m1.save()
    m2.status = 'active'
    m2.save()
    
    TournamentService.report_match_result(m1.id, m1.player1.id, 2, 0)
    TournamentService.report_match_result(m2.id, m2.player2.id, 2, 1)
    
    # Verify Final match (Round 2) is populated
    r2_matches = matches.filter(round_type='knockout', round_number=2)
    assert r2_matches.count() == 1
    m_final = r2_matches.first()
    m_final.refresh_from_db()
    
    print(f"Final match setup: player1={m_final.player1.user.username if m_final.player1 else 'None'} vs player2={m_final.player2.user.username if m_final.player2 else 'None'} | status={m_final.status}")
    assert m_final.player1 == m1.player1
    assert m_final.player2 == m2.player2
    
    print("\n--- Simulating Final Match Resolution ---")
    m_final.status = 'active'
    m_final.save()
    
    TournamentService.report_match_result(m_final.id, m_final.player1.id, 2, 0)
    
    # Verify tournament completed
    tournament.refresh_from_db()
    print(f"Tournament status: {tournament.status}")
    assert tournament.status == 'completed'

    # Assert 5-player rank assignments: Champion=1, Runner-up=2, Semifinalists=3, Play-in loser=5
    parts = TournamentParticipant.objects.filter(tournament=tournament)
    for p in parts:
        if p == m_final.player1:
            assert p.current_rank == 1, f"Champion should have rank 1, got {p.current_rank}"
        elif p == m_final.player2:
            assert p.current_rank == 2, f"Runner-up should have rank 2, got {p.current_rank}"
        elif p in [m1.player2, m2.player1]:
            assert p.current_rank == 3, f"Semifinalist should have rank 3, got {p.current_rank}"
        else:
            assert p.current_rank == 5, f"Play-in loser should have rank 5, got {p.current_rank}"

    print("[Verify] 5-player tournament ranks verified successfully: 1, 2, 3, 3, 5.")

    print("\n--- Seeding 7 Players (Imperfect Bracket) ---")
    users7 = []
    for i in range(1, 8):
        u = User.objects.create_user(username=f'imperfect7_u{i}', email=f'imperfect7_u{i}@pureplay.com', password='password123')
        users7.append(u)

    tournament7 = TournamentService.create_tournament(
        created_by=users7[0],
        name="Tic Tac Toe Imperfect 7-Player Cup",
        game_type="tictactoe",
        entry_fee=0,
        max_players=8,
        bracket_type="single_elimination",
        tournament_type="knockout"
    )

    for u in users7:
        TournamentParticipant.objects.create(tournament=tournament7, user=u)

    tournament7.current_players = 7
    tournament7.save()
    print("Starting 7-player tournament...")
    TournamentService.start_tournament(tournament7.id)

    # Verify 7-player matches count
    matches7 = TournamentMatch.objects.filter(tournament=tournament7).order_by('round_number', 'match_order')
    print(f"Generated 7-player matches count: {matches7.count()}")
    for m in matches7:
         print(f"  R{m.round_number} M{m.match_order} ({m.round_type}) | player1: {m.player1.user.username if m.player1 else 'TBD'} | player2: {m.player2.user.username if m.player2 else 'TBD'} | status: {m.status}")

    playins7 = list(matches7.filter(round_type='play_in'))
    assert len(playins7) == 3, f"Expected 3 play-in matches for 7 players, got {len(playins7)}"

    r1_matches7 = list(matches7.filter(round_type='knockout', round_number=1))
    assert len(r1_matches7) == 2, f"Expected 2 knockout Round 1 matches, got {len(r1_matches7)}"

    # Simulate play-in resolutions
    print("\nSimulating play-in resolutions for 7-player cup...")
    for idx, pm in enumerate(playins7):
        pm.status = 'active'
        pm.save()
        TournamentService.report_match_result(pm.id, pm.player1.id, 2, 0)

    # Verify advancement to Round 1
    m1_7 = r1_matches7[0]
    m2_7 = r1_matches7[1]
    m1_7.refresh_from_db()
    m2_7.refresh_from_db()
    print(f"Round 1 Match 1: {m1_7.player1.user.username if m1_7.player1 else 'None'} vs {m1_7.player2.user.username if m1_7.player2 else 'None'}")
    print(f"Round 1 Match 2: {m2_7.player1.user.username if m2_7.player1 else 'None'} vs {m2_7.player2.user.username if m2_7.player2 else 'None'}")

    assert m1_7.player1 is not None and m1_7.player2 is not None
    assert m2_7.player1 is not None and m2_7.player2 is not None

    # Simulate Round 1 resolutions
    m1_7.status = 'active'
    m1_7.save()
    m2_7.status = 'active'
    m2_7.save()
    TournamentService.report_match_result(m1_7.id, m1_7.player1.id, 2, 0)
    TournamentService.report_match_result(m2_7.id, m2_7.player1.id, 2, 0)

    # Simulate Final resolution
    r2_matches7 = matches7.filter(round_type='knockout', round_number=2)
    assert r2_matches7.count() == 1
    m_final7 = r2_matches7.first()
    m_final7.status = 'active'
    m_final7.save()
    TournamentService.report_match_result(m_final7.id, m_final7.player1.id, 2, 0)

    tournament7.refresh_from_db()
    assert tournament7.status == 'completed'

    # Assert 7-player rank assignments: Champion=1, Runner-up=2, Semifinalists=3, Play-in losers=7
    parts7 = TournamentParticipant.objects.filter(tournament=tournament7)
    for p in parts7:
        if p == m_final7.player1:
            assert p.current_rank == 1, f"Champion should have rank 1, got {p.current_rank}"
        elif p == m_final7.player2:
            assert p.current_rank == 2, f"Runner-up should have rank 2, got {p.current_rank}"
        elif p in [m1_7.player2, m2_7.player2]:
            assert p.current_rank == 3, f"Semifinalist should have rank 3, got {p.current_rank}"
        else:
            assert p.current_rank == 7, f"Play-in loser should have rank 7, got {p.current_rank}"

    print("[Verify] 7-player tournament ranks verified successfully: 1, 2, 3, 3, 7, 7, 7.")
    print("\n[SUCCESS] ALL IMPERFECT BRACKET LIFECYCLE TESTS (5-PLAYER AND 7-PLAYER) COMPLETED SUCCESSFULLY WITHOUT ERRORS! [SUCCESS]")

if __name__ == '__main__':
    try:
        run_verification()
    except AssertionError as e:
        print(f"\n[FAIL] Assertion failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n[FAIL] Verification crashed: {e}")
        sys.exit(1)
