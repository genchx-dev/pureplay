from django.urls import path
from . import views

urlpatterns = [
    path('leaderboard/', views.leaderboard, name='leaderboard'),
    path('my-stats/', views.my_stats, name='my-stats'),
    path('match-history/', views.match_history, name='match-history'),
]