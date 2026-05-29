import requests
from django.conf import settings
from decimal import Decimal

class PaystackService:
    BASE_URL = 'https://api.paystack.co'

    @classmethod
    def initialize_transaction(cls, email, amount, reference, metadata=None):
        """Initialize payment and get authorization URL."""
        headers = {
            'Authorization': f'Bearer {settings.PAYSTACK_SECRET_KEY}',
            'Content-Type': 'application/json',
        }
        data = {
            'email': email,
            'amount': int(amount * 100),  # Paystack uses kobo (cents)
            'reference': reference,
            'callback_url': settings.PAYSTACK_CALLBACK_URL,
            'metadata': metadata or {},
        }
        response = requests.post(f'{cls.BASE_URL}/transaction/initialize', json=data, headers=headers, timeout=10)
        response.raise_for_status()
        return response.json()

    @classmethod
    def verify_transaction(cls, reference):
        """Verify transaction status."""
        headers = {'Authorization': f'Bearer {settings.PAYSTACK_SECRET_KEY}'}
        response = requests.get(f'{cls.BASE_URL}/transaction/verify/{reference}', headers=headers, timeout=10)
        response.raise_for_status()
        return response.json()

    @classmethod
    def create_transfer_recipient(cls, name, account_number, bank_code):
        """Verify bank account and generate a recipient code."""
        headers = {
            'Authorization': f'Bearer {settings.PAYSTACK_SECRET_KEY}',
            'Content-Type': 'application/json',
        }
        data = {
            "type": "nuban",
            "name": name,
            "account_number": account_number,
            "bank_code": bank_code,
            "currency": "NGN"
        }
        response = requests.post(f'{cls.BASE_URL}/transferrecipient', json=data, headers=headers, timeout=10)
        if not response.ok:
            try:
                err_data = response.json()
                msg = err_data.get('message', response.text)
            except Exception:
                msg = response.text
            raise Exception(f"Paystack Error: {msg}")
        return response.json()['data']['recipient_code']

    @classmethod
    def initiate_transfer(cls, amount, recipient_code, reference):
        """Send money from Paystack balance to recipient's bank."""
        headers = {
            'Authorization': f'Bearer {settings.PAYSTACK_SECRET_KEY}',
            'Content-Type': 'application/json',
        }
        data = {
            "source": "balance",
            "reason": "Wallet Withdrawal",
            "amount": int(amount * 100),  # Amount in kobo
            "recipient": recipient_code,
            "reference": reference
        }
        response = requests.post(f'{cls.BASE_URL}/transfer', json=data, headers=headers, timeout=10)
        if not response.ok:
            try:
                err_data = response.json()
                msg = err_data.get('message', response.text)
            except Exception:
                msg = response.text
            raise Exception(f"Paystack Error: {msg}")
        return response.json()