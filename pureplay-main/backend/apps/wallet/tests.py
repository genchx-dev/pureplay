from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.wallet.models import Wallet, Transaction
from apps.wallet.services import WalletService
from decimal import Decimal
from rest_framework.test import APITestCase
from rest_framework.authtoken.models import Token
from unittest.mock import patch

User = get_user_model()

class WalletServiceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='password')
        # Wallet should be created by signal
        self.wallet = self.user.wallet

    def test_deposit(self):
        initial_balance = self.wallet.balance
        amount = Decimal('1000.00')
        
        transaction = WalletService.deposit(self.user, amount, "Test Deposit")
        
        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.balance, initial_balance + amount)
        self.assertEqual(transaction.amount, amount)
        self.assertEqual(transaction.transaction_type, 'deposit')
        self.assertEqual(transaction.status, 'completed')

    def test_withdraw_success(self):
        # Add some balance first
        WalletService.deposit(self.user, Decimal('2000.00'))
        self.wallet.refresh_from_db()
        
        initial_balance = self.wallet.balance
        amount = Decimal('500.00')
        
        transaction = WalletService.withdraw(self.user, amount, "Test Withdrawal")
        
        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.balance, initial_balance - amount)
        self.assertEqual(transaction.amount, amount)
        self.assertEqual(transaction.transaction_type, 'withdrawal')

    def test_withdraw_insufficient_funds(self):
        # Ensure balance is low
        self.wallet.balance = Decimal('100.00')
        self.wallet.save()
        
        with self.assertRaises(ValueError) as cm:
            WalletService.withdraw(self.user, Decimal('500.00'))
        
        self.assertEqual(str(cm.exception), "Insufficient balance")
        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.balance, Decimal('100.00'))

    def test_lock_stake(self):
        WalletService.deposit(self.user, Decimal('1000.00'))
        self.wallet.refresh_from_db()
        
        initial_balance = self.wallet.balance
        amount = Decimal('500.00')
        match_id = "test-match-123"
        
        transaction = WalletService.lock_stake(self.user, amount, match_id)
        
        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.balance, initial_balance - amount)
        self.assertEqual(transaction.transaction_type, 'stake')
        self.assertEqual(transaction.reference_id, match_id)

    def test_payout_win(self):
        # We don't necessarily need balance to receive a payout in this implementation
        # but let's see how it works in services.py
        initial_balance = self.wallet.balance
        amount = Decimal('1500.00')
        match_id = "test-match-win"
        
        transaction = WalletService.payout_win(self.user, amount, match_id)
        
        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.balance, initial_balance + amount)
        self.assertEqual(transaction.transaction_type, 'win')
        self.assertEqual(transaction.reference_id, match_id)


class WalletViewTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testviewuser', password='password123')
        self.wallet = self.user.wallet
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token.key)

    @patch('apps.wallet.views.PaystackService.create_transfer_recipient')
    @patch('apps.wallet.views.PaystackService.initiate_transfer')
    def test_withdraw_api_success(self, mock_initiate, mock_create_recipient):
        # Setup mock return values
        mock_create_recipient.return_value = 'RCP_123456'
        mock_initiate.return_value = {'status': True, 'message': 'Transfer queued'}

        self.wallet.refresh_from_db()
        initial_balance = self.wallet.balance

        # Deposit funds to withdraw
        WalletService.deposit(self.user, Decimal('5000.00'))
        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.balance, initial_balance + Decimal('5000.00'))

        url = '/api/wallet/withdraw/'
        data = {
            'amount': 2000.00,
            'bankDetails': {
                'bankName': 'Zenith Bank',
                'accountNumber': '0123456789',
                'accountName': 'John Doe'
            }
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, 201)
        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.balance, initial_balance + Decimal('3000.00'))

        # Verify transaction log
        tx = Transaction.objects.filter(wallet=self.wallet, transaction_type='withdrawal').first()
        self.assertIsNotNone(tx)
        self.assertEqual(tx.status, 'completed')
        self.assertEqual(tx.amount, Decimal('2000.00'))
        self.assertTrue(tx.reference_id.startswith('WD-'))

        # Verify Paystack service mock calls
        mock_create_recipient.assert_called_once_with(
            name='John Doe',
            account_number='0123456789',
            bank_code='057'  # Zenith code resolved from mapping
        )
        mock_initiate.assert_called_once()

    @patch('apps.wallet.views.PaystackService.create_transfer_recipient')
    @patch('apps.wallet.views.PaystackService.initiate_transfer')
    def test_withdraw_api_paystack_failure(self, mock_initiate, mock_create_recipient):
        # Setup mock behavior: create recipient succeeds, but transfer initiation fails
        mock_create_recipient.return_value = 'RCP_123456'
        mock_initiate.side_effect = Exception("Paystack API balance error")

        self.wallet.refresh_from_db()
        initial_balance = self.wallet.balance

        # Deposit funds to withdraw
        WalletService.deposit(self.user, Decimal('5000.00'))
        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.balance, initial_balance + Decimal('5000.00'))

        url = '/api/wallet/withdraw/'
        data = {
            'amount': 2000.00,
            'bankDetails': {
                'bankName': 'Zenith Bank',
                'accountNumber': '0123456789',
                'accountName': 'John Doe'
            }
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertIn("Withdrawal failed", response.data['error'])

        # Wallet balance should be refunded/unchanged
        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.balance, initial_balance + Decimal('5000.00'))

        # Transaction log should mark it failed
        tx = Transaction.objects.filter(wallet=self.wallet, transaction_type='withdrawal').first()
        self.assertIsNotNone(tx)
        self.assertEqual(tx.status, 'failed')
        self.assertIn("Paystack API balance error", tx.description)
