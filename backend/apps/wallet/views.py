from rest_framework import views, response, permissions
from .models import Wallet

class WalletBalanceView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        wallet, created = Wallet.objects.get_or_create(user=request.user)
        return response.Response({
            'balance': float(wallet.balance)
        })

class TransactionHistoryView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return response.Response([])
