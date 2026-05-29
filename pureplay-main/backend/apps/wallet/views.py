import uuid
from decimal import Decimal
from django.db import transaction
from django.conf import settings
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Wallet, Transaction, PaymentTransaction
from .serializers import WalletSerializer, TransactionSerializer
from .services import WalletService
from .paystack import PaystackService

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_balance(request):
    wallet, _ = Wallet.objects.get_or_create(user=request.user)
    serializer = WalletSerializer(wallet)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_transactions(request):
    wallet, _ = Wallet.objects.get_or_create(user=request.user)
    transactions = Transaction.objects.filter(wallet=wallet).order_by('-created_at')
    serializer = TransactionSerializer(transactions, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def deposit(request):
    amount = request.data.get('amount')
    if not amount or float(amount) <= 0:
        return Response({'error': 'Invalid amount'}, status=status.HTTP_400_BAD_REQUEST)
    
    transaction = WalletService.deposit(request.user, amount)
    wallet = transaction.wallet
    
    return Response({
        'transaction': TransactionSerializer(transaction).data,
        'balance': float(wallet.balance)
    }, status=status.HTTP_201_CREATED)

BANK_CODES = {
    'access': '044',
    'citibank': '023',
    'ecobank': '050',
    'fidelity': '070',
    'first bank': '011',
    'fcmb': '214',
    'first city monument': '214',
    'gtb': '058',
    'gtbank': '058',
    'guaranty trust': '058',
    'heritage': '030',
    'keystone': '082',
    'opay': '999992',
    'palmpay': '999991',
    'moniepoint': '50515',
    'kuda': '50211',
    'providus': '101',
    'skye': '076',
    'polaris': '076',
    'stanbic': '221',
    'standard chartered': '068',
    'sterling': '232',
    'union': '032',
    'uba': '033',
    'united bank for africa': '033',
    'unity': '215',
    'wema': '035',
    'zenith': '057',
}

def resolve_bank_code(bank_name):
    name_lower = str(bank_name).lower().strip()
    for key, code in BANK_CODES.items():
        if key in name_lower:
            return code
    return '058'  # Default fallback to GTBank

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def withdraw(request):
    amount = request.data.get('amount')
    bank_details = request.data.get('bankDetails')
    
    if not amount or float(amount) <= 0:
        return Response({'error': 'Invalid amount'}, status=status.HTTP_400_BAD_REQUEST)
        
    if not bank_details:
        return Response({'error': 'Bank details are required'}, status=status.HTTP_400_BAD_REQUEST)
        
    bank_name = bank_details.get('bankName')
    account_number = bank_details.get('accountNumber')
    account_name = bank_details.get('accountName')
    
    if not bank_name or not account_number or not account_name:
        return Response({'error': 'Incomplete bank details'}, status=status.HTTP_400_BAD_REQUEST)
        
    amount_decimal = Decimal(str(amount))
    reference = f"WD-{request.user.id}-{uuid.uuid4().hex[:10]}"
    
    # 1. Debit and create pending transaction atomically to prevent double spend
    try:
        with transaction.atomic():
            wallet, _ = Wallet.objects.select_for_update().get_or_create(user=request.user)
            if wallet.balance < amount_decimal:
                return Response({'error': 'Insufficient balance'}, status=status.HTTP_400_BAD_REQUEST)
            
            wallet.balance -= amount_decimal
            wallet.save()
            
            tx = Transaction.objects.create(
                wallet=wallet,
                amount=amount_decimal,
                transaction_type='withdrawal',
                description=f"Withdrawal to {bank_name} ({account_number})",
                status='pending',
                reference_id=reference
            )
    except Exception as e:
        return Response({'error': f"Failed to initiate withdrawal: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
        
    # 2. Call Paystack APIs outside the DB transaction to avoid locking connections
    try:
        bank_code = resolve_bank_code(bank_name)
        
        # Step A: Create Transfer Recipient
        try:
            recipient_code = PaystackService.create_transfer_recipient(
                name=account_name,
                account_number=account_number,
                bank_code=bank_code
            )
        except Exception as e:
            # Handle Starter Business exception in test mode
            is_test_key = getattr(settings, 'PAYSTACK_SECRET_KEY', '').startswith('sk_test_')
            if "starter business" in str(e).lower() and is_test_key:
                recipient_code = "RCP_simulated_starter_business"
            else:
                raise e
        
        # Step B: Initiate Transfer
        try:
            PaystackService.initiate_transfer(
                amount=amount_decimal,
                recipient_code=recipient_code,
                reference=reference
            )
        except Exception as e:
            # Handle Starter Business exception in test mode
            is_test_key = getattr(settings, 'PAYSTACK_SECRET_KEY', '').startswith('sk_test_')
            if "starter business" in str(e).lower() and is_test_key:
                print(f"[Paystack Sandbox Fallback] Simulating transfer success due to starter business restriction: {str(e)}")
            else:
                raise e
        
        # Update transaction to completed
        tx.status = 'completed'
        tx.save()
        
        return Response({
            'transaction': TransactionSerializer(tx).data,
            'balance': float(wallet.balance)
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        # Refund user balance in case of API failure
        try:
            with transaction.atomic():
                wallet = Wallet.objects.select_for_update().get(user=request.user)
                wallet.balance += amount_decimal
                wallet.save()
                
                tx.status = 'failed'
                tx.description = f"Withdrawal failed: {str(e)}"
                tx.save()
        except Exception as refund_err:
            pass
            
        return Response({'error': f"Withdrawal failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def deposit_initialize(request):
    amount = request.data.get('amount')
    if not amount or float(amount) <= 0:
        return Response({'error': 'Invalid amount'}, status=status.HTTP_400_BAD_REQUEST)
    
    reference = f"DEP-{request.user.id}-{uuid.uuid4().hex[:10]}"
    email = request.user.email or f"{request.user.username}@example.com"
    
    try:
        res = PaystackService.initialize_transaction(email, Decimal(amount), reference, metadata={'user_id': request.user.id})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    PaymentTransaction.objects.create(
        user=request.user,
        reference=reference,
        amount=amount,
        status='pending',
        paystack_response=res
    )
    return Response({
        'authorization_url': res['data']['authorization_url'],
        'reference': reference,
    })

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def deposit_verify(request):
    reference = request.query_params.get('reference')
    if not reference:
        return Response({'error': 'Reference required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Check current status first to return early if already processed
        tx_check = PaymentTransaction.objects.get(reference=reference, user=request.user)
        if tx_check.status == 'success':
            return Response({'status': tx_check.status, 'amount': float(tx_check.amount)})
            
        # Verify transaction with Paystack outside DB lock to prevent connection exhaustion
        res = PaystackService.verify_transaction(reference)
        
        # Use database transaction with row-level locking to prevent concurrent double credit
        with transaction.atomic():
            tx = PaymentTransaction.objects.select_for_update().get(reference=reference, user=request.user)
            if tx.status == 'success':
                return Response({'status': tx.status, 'amount': float(tx.amount)})
                
            tx.paystack_response = res
            if res.get('data', {}).get('status') == 'success':
                tx.status = 'success'
                tx.save()
                WalletService.deposit(request.user, tx.amount, f"Paystack deposit {reference}")
            else:
                tx.status = 'failed'
                tx.save()
                
            return Response({'status': tx.status, 'amount': float(tx.amount)})
    except PaymentTransaction.DoesNotExist:
        return Response({'error': 'Transaction not found'}, status=status.HTTP_404_NOT_FOUND)