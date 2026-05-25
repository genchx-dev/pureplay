# pureplay-main/backend/apps/tournaments/urls.py

from django.urls import path
from . import views

urlpatterns = [
    path('', views.list_tournaments, name='tournament-list'),
    path('create/', views.create_tournament, name='tournament-create'),
    path('<uuid:tournament_id>/join/', views.join_tournament, name='tournament-join'),
    path('<uuid:tournament_id>/', views.tournament_detail, name='tournament-detail'),
    path('<uuid:tournament_id>/bracket/', views.tournament_bracket, name='tournament-bracket'),
    path('match/<int:match_id>/start/', views.start_match, name='tournament-start-match'),
    path('match/<int:match_id>/report/', views.report_match_result, name='tournament-report-match'),
]
