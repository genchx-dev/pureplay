# pureplay-main/backend/test_complete_flow.py

import os
import django
import sys

# Setup Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from apps.tournaments.models import Tournament, TournamentParticipant, TournamentMatch
from apps.tournaments.services import TournamentService, KnockoutService
from apps.wallet.services import WalletService
from apps.wallet.models import Wallet, Transaction

User = get_user_model()

def clean_database():
    print("[Clean] Cleaning old test data...")
    # Delete old tournaments
    Tournament.objects.all().delete()
    # Delete test users
    User.objects.filter(username__in=['alice_test', 'bob_test', 'charlie_test', 'dave_test']).delete()
    print("[Clean] Database cleaned.")

def run_verification():
    clean_database()
    
    print("\n--- 1. User System Verification ---")
    # Signup / Setup test users
    alice = User.objects.create_user(username='alice_test', email='alice@pureplay.com', password='password123')
    bob = User.objects.create_user(username='bob_test', email='bob@pureplay.com', password='password123')
    charlie = User.objects.create_user(username='charlie_test', email='charlie@pureplay.com', password='password123')
    dave = User.objects.create_user(username='dave_test', email='dave@pureplay.com', password='password123')
    
    print(f"Created users: {[u.username for u in [alice, bob, charlie, dave]]}")
    
    # Wallet balance initial check (Welcome bonus adds NGN 5000 by default)
    for u in [alice, bob, charlie, dave]:
        wallet = WalletService.get_wallet(u)
        assert wallet.balance == 5000, f"Expected initial balance 5000 for {u.username}, got {wallet.balance}"
    print("Initial wallet balances verified (all are 5000 from Welcome Bonus).")
    
    # Funding wallets
    print("\nFunding wallets with NGN 1000 each...")
    for u in [alice, bob, charlie, dave]:
        WalletService.deposit(u, 1000, "Initial Deposit")
        wallet = WalletService.get_wallet(u)
        assert wallet.balance == 6000, f"Expected balance 6000 for {u.username}, got {wallet.balance}"
    print("Wallets funded successfully (all balances are NGN 6,000.00).")
    
    print("\n--- 2. Tournament System & Entry Fee Deduction Verification ---")
    # Create tournament with NGN 300 entry fee
    tournament = TournamentService.create_tournament(
        created_by=alice,
        name="Tic Tac Toe Verification Cup",
        game_type="tictactoe",
        entry_fee=300,
        max_players=4,
        bracket_type="single_elimination",
        tournament_type="knockout"
    )
    print(f"Tournament created: {tournament.name} | Entry Fee: NGN {tournament.entry_fee} | Max Players: {tournament.max_players}")
    
    # Users join the tournament and pay the entry fee
    print("\nRegistering players and checking entry fee deductions...")
    players = [alice, bob, charlie, dave]
    for p in players:
        # Register user
        success = TournamentService.register_user(tournament.id, p)
        assert success is True
        
        # Verify wallet balance deduction
        wallet = Wallet.objects.get(user=p)
        print(f"Player {p.username} - Balance: {wallet.balance} | Locked: {wallet.locked_balance}")
        assert wallet.balance == 5700, f"Expected balance 5700 for {p.username}, got {wallet.balance}"
        
        if p.username != 'dave_test':
            assert wallet.locked_balance == 300, f"Expected locked balance 300 for {p.username}, got {wallet.locked_balance}"
        else:
            assert wallet.locked_balance == 0, f"Expected locked balance 0 for {p.username} after auto-start, got {wallet.locked_balance}"
            
    # After the registration loop finishes, all players should have had their entry fees consumed (locked balance reset to 0)
    print("\nVerifying all players locked balances are consumed...")
    for p in players:
        wallet = Wallet.objects.get(user=p)
        assert wallet.locked_balance == 0, f"Expected locked balance 0 for {p.username} after tournament start, got {wallet.locked_balance}"
        assert wallet.balance == 5700, f"Expected balance 5700 for {p.username}, got {wallet.balance}"
    print("All entry fees successfully consumed from locked balances.")
    
    # Reload tournament from DB
    tournament.refresh_from_db()
    print(f"All 4 players registered. Tournament status: {tournament.status} | Prize pool: NGN {tournament.prize_pool}")
    assert tournament.status == 'in_progress', f"Expected tournament status in_progress, got {tournament.status}"
    assert tournament.current_players == 4, f"Expected 4 current players, got {tournament.current_players}"
    
    print("\n--- 3. Match System & Pairing Verification ---")
    # Verify matches are generated
    matches = TournamentMatch.objects.filter(tournament=tournament).order_by('round_number', 'match_order')
    assert matches.count() == 3, f"Expected 3 matches in total (2 in R1, 1 in R2), got {matches.count()}"
    
    r1_matches = matches.filter(round_number=1)
    r2_matches = matches.filter(round_number=2)
    
    assert r1_matches.count() == 2, f"Expected 2 matches in Round 1, got {r1_matches.count()}"
    assert r2_matches.count() == 1, f"Expected 1 match in Round 2, got {r2_matches.count()}"
    
    m1 = r1_matches[0]
    m2 = r1_matches[1]
    m_final = r2_matches[0]
    
    print("Round 1 Matches:")
    print(f"  Match 1: {m1.player1.user.username} vs {m1.player2.user.username} | Status: {m1.status}")
    print(f"  Match 2: {m2.player1.user.username} vs {m2.player2.user.username} | Status: {m2.status}")
    
    assert m1.player1 is not None and m1.player2 is not None
    assert m2.player1 is not None and m2.player2 is not None
    assert m_final.player1 is None and m_final.player2 is None, "Final match players should be TBD (None) initially"
    
    # Determine the winners of Round 1
    winner1 = m1.player1  # Let's say player1 wins Match 1
    loser1 = m1.player2
    winner2 = m2.player1  # Let's say player1 wins Match 2
    loser2 = m2.player2
    
    # Start Round 1 matches
    print("\nStarting and reporting Round 1 matches...")
    m1.status = 'active'
    m1.save()
    m2.status = 'active'
    m2.save()
    
    # Report result for Match 1
    TournamentService.report_match_result(
        tournament_match_id=m1.id,
        winner_participant_id=winner1.id,
        player1_score=2,
        player2_score=1
    )
    # Report result for Match 2
    TournamentService.report_match_result(
        tournament_match_id=m2.id,
        winner_participant_id=winner2.id,
        player1_score=2,
        player2_score=0
    )
    
    # Check advancement in Round 2 (Final)
    m_final.refresh_from_db()
    print(f"Round 1 matches completed.")
    print(f"  Match 1 Winner: {winner1.user.username} (Loser: {loser1.user.username})")
    print(f"  Match 2 Winner: {winner2.user.username} (Loser: {loser2.user.username})")
    print(f"Final Match Setup: {m_final.player1.user.username if m_final.player1 else 'None'} vs {m_final.player2.user.username if m_final.player2 else 'None'} | Status: {m_final.status}")
    
    assert m_final.player1 == winner1, f"Expected {winner1.user.username} in Final, got {m_final.player1}"
    assert m_final.player2 == winner2, f"Expected {winner2.user.username} in Final, got {m_final.player2}"
    
    # Start Final match
    m_final.status = 'active'
    m_final.save()
    
    print("\n--- 4. Tournament Completion & Prize Payout Verification ---")
    # Report Final result (winner1 wins)
    TournamentService.report_match_result(
        tournament_match_id=m_final.id,
        winner_participant_id=winner1.id,
        player1_score=2,
        player2_score=1
    )
    
    # Refresh tournament
    tournament.refresh_from_db()
    print(f"Tournament status: {tournament.status}")
    assert tournament.status == 'completed', f"Expected tournament status 'completed', got {tournament.status}"
    
    # Verify participant ranks
    part_winner = TournamentParticipant.objects.get(tournament=tournament, user=winner1.user)
    part_runnerup = TournamentParticipant.objects.get(tournament=tournament, user=winner2.user)
    part_semifinalist1 = TournamentParticipant.objects.get(tournament=tournament, user=loser1.user)
    part_semifinalist2 = TournamentParticipant.objects.get(tournament=tournament, user=loser2.user)
    
    print("Tournament Final Ranks:")
    print(f"  Rank 1: {part_winner.user.username} (Winner)")
    print(f"  Rank 2: {part_runnerup.user.username} (Runner-up)")
    print(f"  Rank 3: {part_semifinalist1.user.username} (Semifinalist)")
    print(f"  Rank 3: {part_semifinalist2.user.username} (Semifinalist)")
    
    assert part_winner.current_rank == 1
    assert part_runnerup.current_rank == 2
    assert part_semifinalist1.current_rank == 3
    assert part_semifinalist2.current_rank == 3
    
    # Verify wallet prize distributions using default fallback percentages
    # Total prize pool: 4 * 300 = 1200 NGN
    # Initial balance: 5000 (bonus) + 1000 (deposit) = 6000 NGN
    # Entry fee: -300 NGN
    # Subtotal before payout: 5700 NGN
    # Default Payouts:
    # 1st Place (Winner): 1200 * 40% = 480 NGN -> Final = 6180 NGN
    # 2nd Place (Runner-up): 1200 * 25% = 300 NGN -> Final = 6000 NGN
    # 3rd Place (Semifinalist 1): 1200 * 15% = 180 NGN -> Final = 5880 NGN
    # 4th Place (Semifinalist 2): 1200 * 12% = 144 NGN -> Final = 5844 NGN
    
    # Retrieve participants ordered by current_rank to match the payout order
    ordered_parts = list(TournamentParticipant.objects.filter(tournament=tournament).order_by('current_rank'))
    p1_from_list = ordered_parts[0] # Winner
    p2_from_list = ordered_parts[1] # Runner-up
    p3_from_list = ordered_parts[2] # Semifinalist 1
    p4_from_list = ordered_parts[3] # Semifinalist 2
    
    wallet_p1 = Wallet.objects.get(user=p1_from_list.user)
    wallet_p2 = Wallet.objects.get(user=p2_from_list.user)
    wallet_p3 = Wallet.objects.get(user=p3_from_list.user)
    wallet_p4 = Wallet.objects.get(user=p4_from_list.user)
    
    print("\nFinal Wallet Balances:")
    print(f"  1st place ({p1_from_list.user.username}): Balance={wallet_p1.balance} | Locked={wallet_p1.locked_balance}")
    print(f"  2nd place ({p2_from_list.user.username}): Balance={wallet_p2.balance} | Locked={wallet_p2.locked_balance}")
    print(f"  3rd place ({p3_from_list.user.username}): Balance={wallet_p3.balance} | Locked={wallet_p3.locked_balance}")
    print(f"  4th place ({p4_from_list.user.username}): Balance={wallet_p4.balance} | Locked={wallet_p4.locked_balance}")
    
    # Assert balances are correct
    assert wallet_p1.balance == 6180, f"Expected 6180, got {wallet_p1.balance}"
    assert wallet_p2.balance == 6000, f"Expected 6000, got {wallet_p2.balance}"
    assert wallet_p3.balance == 5880, f"Expected 5880, got {wallet_p3.balance}"
    assert wallet_p4.balance == 5844, f"Expected 5844, got {wallet_p4.balance}"
    
    # Assert locked balances are all 0 (since they have been unlocked/deducted upon completion)
    for p in players:
        w = Wallet.objects.get(user=p)
        assert w.locked_balance == 0, f"Expected locked balance 0 for {p.username}, got {w.locked_balance}"
    
    print("\n[SUCCESS] ALL 4 CORE BACKEND SYSTEMS ARE WORKING FLAWLESSLY AND COMPLETELY IN ALIGNMENT WITH DESIGN PHILOSOPHY! [SUCCESS]")

if __name__ == '__main__':
    try:
        run_verification()
    except AssertionError as e:
        print(f"\n[FAIL] Assertion failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n[FAIL] Verification crashed: {e}")
        sys.exit(1)
