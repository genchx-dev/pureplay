from django.urls import path
from . import views

urlpatterns = [
    path('queue/', views.join_queue_view),
    path('available-players/', views.available_players_view),
]