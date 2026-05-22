from django.urls import path
from . import views

urlpatterns = [
    path('queue/', views.join_queue_view),
    path('queue/cancel/', views.cancel_queue_view),
    path('open-matches/', views.open_matches_view),
    path('open-matches/accept/', views.accept_open_match_view),
    path('available-players/', views.available_players_view),
    path('challenge/', views.challenge_player_view),
]
