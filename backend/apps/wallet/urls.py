from django.urls import path
from . import views

urlpatterns = [
    path('balance/', views.get_balance),
    path('transactions/', views.get_transactions),
]