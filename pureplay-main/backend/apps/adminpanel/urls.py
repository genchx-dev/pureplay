# apps/adminpanel/urls.py

from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/', views.admin_dashboard, name='admin-dashboard'),
    path('analytics/', views.admin_analytics, name='admin-analytics'),
    path('users/', views.admin_users, name='admin-users'),
    path('tournaments/', views.admin_tournaments, name='admin-tournaments'),
    path('tournaments/create/', views.admin_create_tournament, name='admin-create-tournament'),
    path('tournaments/<uuid:tournament_id>/start/', views.admin_start_tournament, name='admin-start-tournament'),
    path('tournaments/<uuid:tournament_id>/cancel/', views.admin_cancel_tournament, name='admin-cancel-tournament'),
    path('transactions/', views.admin_transactions, name='admin-transactions'),
    path('matches/', views.admin_matches, name='admin-matches'),
    path('games/', views.admin_games, name='admin-games'),
]
