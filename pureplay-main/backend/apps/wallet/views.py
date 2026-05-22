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
