from django.urls import path
from . import views

urlpatterns = [
    path('', views.list_tournaments),
    path('<uuid:tournament_id>/join/', views.join_tournament),
]
