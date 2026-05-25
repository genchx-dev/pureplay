from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Wallet, Transaction
from .serializers import WalletSerializer, TransactionSerializer
from .services import WalletService

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

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def withdraw(request):
    amount = request.data.get('amount')
    if not amount or float(amount) <= 0:
        return Response({'error': 'Invalid amount'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        transaction = WalletService.withdraw(request.user, amount)
        wallet = transaction.wallet
        return Response({
            'transaction': TransactionSerializer(transaction).data,
            'balance': float(wallet.balance)
        }, status=status.HTTP_201_CREATED)
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

import uuid
from decimal import Decimal
from .paystack import PaystackService
from .models import PaymentTransaction
from .services import WalletService

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
        tx = PaymentTransaction.objects.get(reference=reference, user=request.user)
        res = PaystackService.verify_transaction(reference)
        tx.paystack_response = res
        if res['data']['status'] == 'success':
            tx.status = 'success'
            # Credit wallet
            WalletService.deposit(request.user, tx.amount, f"Paystack deposit {reference}")
        else:
            tx.status = 'failed'
        tx.save()
        return Response({'status': tx.status, 'amount': float(tx.amount)})
    except PaymentTransaction.DoesNotExist:
        return Response({'error': 'Transaction not found'}, status=status.HTTP_404_NOT_FOUND)