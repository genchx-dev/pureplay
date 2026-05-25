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
        response = requests.post(f'{cls.BASE_URL}/transaction/initialize', json=data, headers=headers)
        response.raise_for_status()
        return response.json()

    @classmethod
    def verify_transaction(cls, reference):
        """Verify transaction status."""
        headers = {'Authorization': f'Bearer {settings.PAYSTACK_SECRET_KEY}'}
        response = requests.get(f'{cls.BASE_URL}/transaction/verify/{reference}', headers=headers)
        response.raise_for_status()
        return response.json()