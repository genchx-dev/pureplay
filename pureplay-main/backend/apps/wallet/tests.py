from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.wallet.models import Wallet, Transaction
from apps.wallet.services import WalletService
from decimal import Decimal

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
