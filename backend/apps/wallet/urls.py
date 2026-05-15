from django.urls import path
from .views import WalletBalanceView, TransactionHistoryView

urlpatterns = [
    path('balance/', WalletBalanceView.as_view(), name='wallet-balance'),
    path('transactions/', TransactionHistoryView.as_view(), name='wallet-transactions'),
]
