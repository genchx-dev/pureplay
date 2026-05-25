from django.urls import path
from . import views

urlpatterns = [
    path('balance/', views.get_balance),
    path('transactions/', views.get_transactions),
    path('deposit/', views.deposit),
    path('withdraw/', views.withdraw),
    path('deposit/initialize/', views.deposit_initialize, name='deposit-initialize'),
    path('deposit/verify/', views.deposit_verify, name='deposit-verify'),
]
