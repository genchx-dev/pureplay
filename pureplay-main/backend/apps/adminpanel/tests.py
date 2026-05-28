from decimal import Decimal
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework.test import APITestCase
from rest_framework.authtoken.models import Token
from rest_framework import status
from apps.matches.models import Match
from apps.tournaments.models import Tournament, TournamentParticipant
from apps.wallet.models import Wallet, Transaction
from apps.rankings.models import PlayerStats

User = get_user_model()

class AdminPanelTests(APITestCase):
    def setUp(self):
        # Create different user types
        self.staff_user = User.objects.create_user(
            username='admin_user',
            email='admin@pureplay.com',
            password='password123',
            is_staff=True
        )
        self.staff_token = Token.objects.create(user=self.staff_user)

        self.normal_user = User.objects.create_user(
            username='normal_user',
            email='user@pureplay.com',
            password='password123',
            is_staff=False
        )
        self.normal_token = Token.objects.create(user=self.normal_user)

        # Pre-create wallets for wallet sum testing
        self.staff_user.wallet.balance = Decimal('100.00')
        self.staff_user.wallet.save()
        self.normal_user.wallet.balance = Decimal('500.00')
        self.normal_user.wallet.save()

    def set_auth_token(self, token_key):
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + token_key)

    def clear_auth(self):
        self.client.credentials()

    def test_permission_denied_anonymous(self):
        """Verify that anonymous users cannot access the dashboard."""
        self.clear_auth()
        response = self.client.get('/api/admin/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_permission_denied_normal_user(self):
        """Verify that standard users cannot access the dashboard."""
        self.set_auth_token(self.normal_token.key)
        response = self.client.get('/api/admin/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_dashboard_success(self):
        """Verify dashboard statistics and revenue breakdown."""
        self.set_auth_token(self.staff_token.key)

        # Create a completed tournament
        t = Tournament.objects.create(
            created_by=self.staff_user,
            name='Test Tournament',
            game_type='tictactoe',
            entry_fee=Decimal('50.00'),
            max_players=4,
            current_players=4,
            prize_pool=Decimal('150.00'), # 4 * 50 = 200, prize pool = 150, platform cut = 50
            status='completed'
        )
        # Create a completed match (Quick Match)
        # Quick Match has status completed. Quick match revenue is sum(stakes) - sum(won).
        # In views.py: total_staked - total_won
        Transaction.objects.create(wallet=self.normal_user.wallet, amount=Decimal('100.00'), transaction_type='stake', status='completed')
        Transaction.objects.create(wallet=self.normal_user.wallet, amount=Decimal('90.00'), transaction_type='win', status='completed')

        response = self.client.get('/api/admin/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data
        self.assertIn('users', data)
        self.assertIn('matches', data)
        self.assertIn('tournaments', data)
        self.assertIn('financial', data)
        self.assertIn('revenue', data)

        # Revenue checking:
        # Tournament revenue: total_entry_fees (4 * 50 = 200) - total_prize_distributed (150) = 50.00
        # Quick Match revenue: total_staked (100) - total_won (90) = 10.00
        # Total Platform Revenue: 50.00 + 10.00 = 60.00
        self.assertEqual(data['revenue']['tournament_revenue'], 50.0)
        self.assertEqual(data['revenue']['quick_match_revenue'], 10.0)
        self.assertEqual(data['revenue']['total_platform_revenue'], 60.0)

    def test_admin_analytics(self):
        """Verify the 30-day daily timeseries structure."""
        self.set_auth_token(self.staff_token.key)
        response = self.client.get('/api/admin/analytics/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.data
        self.assertIn('daily_signups', data)
        self.assertIn('daily_matches', data)
        self.assertIn('daily_deposits', data)
        self.assertIn('daily_withdrawals', data)
        self.assertIn('daily_stakes', data)

    def test_admin_users(self):
        """Verify that user retrieval and search functions correctly."""
        self.set_auth_token(self.staff_token.key)

        # Test listing users
        response = self.client.get('/api/admin/users/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total'], 2)

        # Test search filter
        response = self.client.get('/api/admin/users/?search=admin')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total'], 1)
        self.assertEqual(response.data['results'][0]['username'], 'admin_user')

    def test_admin_tournaments(self):
        """Verify listing tournaments."""
        self.set_auth_token(self.staff_token.key)
        
        t = Tournament.objects.create(
            created_by=self.staff_user,
            name='Listed Tournament',
            game_type='chess',
            entry_fee=Decimal('10.00'),
            max_players=8,
            status='registering',
            scheduled_start_time=timezone.now() + timezone.timedelta(days=2),
            registration_deadline=timezone.now() + timezone.timedelta(days=1)
        )

        response = self.client.get('/api/admin/tournaments/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total'], 1)
        self.assertEqual(response.data['results'][0]['name'], 'Listed Tournament')
        self.assertIsNotNone(response.data['results'][0]['scheduled_start_time'])
        self.assertIsNotNone(response.data['results'][0]['registration_deadline'])

    def test_admin_create_tournament(self):
        """Verify creating a tournament with scheduling fields."""
        self.set_auth_token(self.staff_token.key)

        start_time = (timezone.now() + timezone.timedelta(days=2)).isoformat()
        deadline = (timezone.now() + timezone.timedelta(days=1)).isoformat()

        payload = {
            'name': 'Weekly Chess Masters',
            'game_type': 'chess',
            'entry_fee': 200,
            'max_players': 16,
            'bracket_type': 'single_elimination',
            'tournament_type': 'knockout',
            'scheduled_start_time': start_time,
            'registration_deadline': deadline,
            'prize_distribution': {'1': 70, '2': 30}
        }

        response = self.client.post('/api/admin/tournaments/create/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        t = Tournament.objects.get(id=response.data['id'])
        self.assertEqual(t.name, 'Weekly Chess Masters')
        self.assertEqual(t.game_type, 'chess')
        self.assertEqual(t.entry_fee, Decimal('200.00'))
        self.assertEqual(t.max_players, 16)
        self.assertIsNotNone(t.scheduled_start_time)
        self.assertIsNotNone(t.registration_deadline)

    def test_admin_cancel_tournament(self):
        """Verify cancellation of a tournament and participant entry fee refunding."""
        self.set_auth_token(self.staff_token.key)

        t = Tournament.objects.create(
            created_by=self.staff_user,
            name='Refund Tournament',
            game_type='tictactoe',
            entry_fee=Decimal('100.00'),
            max_players=4,
            current_players=1,
            status='registering'
        )

        TournamentParticipant.objects.create(tournament=t, user=self.normal_user)
        initial_balance = self.normal_user.wallet.balance

        response = self.client.post(f'/api/admin/tournaments/{t.id}/cancel/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        t.refresh_from_db()
        self.assertEqual(t.status, 'cancelled')

        self.normal_user.wallet.refresh_from_db()
        self.assertEqual(self.normal_user.wallet.balance, initial_balance + Decimal('100.00'))

    def test_admin_transactions(self):
        """Verify transactions audit log and filtering."""
        self.set_auth_token(self.staff_token.key)

        # Create some transactions
        Transaction.objects.create(wallet=self.normal_user.wallet, amount=Decimal('50.00'), transaction_type='deposit', status='completed')
        Transaction.objects.create(wallet=self.normal_user.wallet, amount=Decimal('20.00'), transaction_type='withdrawal', status='pending')

        # List all
        response = self.client.get('/api/admin/transactions/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total'], 4)

        # Filter by type
        response = self.client.get('/api/admin/transactions/?type=deposit')
        self.assertEqual(response.data['total'], 3)
        self.assertEqual(response.data['results'][0]['type'], 'deposit')

        # Filter by status
        response = self.client.get('/api/admin/transactions/?status=pending')
        self.assertEqual(response.data['total'], 1)
        self.assertEqual(response.data['results'][0]['status'], 'pending')

    def test_admin_matches(self):
        """Verify matches listing."""
        self.set_auth_token(self.staff_token.key)

        Match.objects.create(
            player1=self.staff_user,
            player2=self.normal_user,
            status='active',
            game_state={'gameType': 'chess', 'matchStake': 20.0, 'isTournament': False}
        )

        response = self.client.get('/api/admin/matches/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total'], 1)
        self.assertEqual(response.data['results'][0]['status'], 'active')
        self.assertEqual(response.data['results'][0]['game_type'], 'chess')
        self.assertEqual(response.data['results'][0]['stake'], 20.0)
