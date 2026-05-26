from django.urls import path
from . import views

urlpatterns = [
    path('queue/', views.join_queue_view),
    path('queue/cancel/', views.cancel_queue_view),
    path('open-matches/', views.open_matches_view),
    path('open-matches/accept/', views.accept_open_match_view),
    path('available-players/', views.available_players_view),
    path('challenge/', views.challenge_player_view),

    # Frontend expected challenge endpoints
    path('challenges/incoming/', views.incoming_challenges, name='challenges-incoming-frontend'),
    path('challenges/<int:challenge_id>/accept/', views.accept_challenge, name='challenge-accept-frontend'),
    path('challenges/<int:challenge_id>/decline/', views.decline_challenge, name='challenge-decline-frontend'),

    # New challenge endpoints (note: use views. prefix)
    path('send-challenge/', views.send_challenge, name='send-challenge'),
    path('accept-challenge/<int:challenge_id>/', views.accept_challenge, name='accept-challenge'),
    path('decline-challenge/<int:challenge_id>/', views.decline_challenge, name='decline-challenge'),
    path('incoming-challenges/', views.incoming_challenges, name='incoming-challenges'),
    path('outgoing-challenges/', views.outgoing_challenges, name='outgoing-challenges'),
    path('challenge/<int:challenge_id>/', views.get_challenge, name='get-challenge'),
]