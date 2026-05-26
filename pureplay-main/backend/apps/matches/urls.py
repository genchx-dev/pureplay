from django.urls import path
from . import views

urlpatterns = [
    # Create match (supports both /matches/ and /matches/create/)
    path('', views.create_match_view, name='create_match_root'),
    path('create/', views.create_match_view, name='create_match'),
    
    # Join match
    path('<int:match_id>/join/', views.join_match_view, name='join_match'),
    
    # Match history
    path('history/', views.match_history_view, name='match_history'),
    
    # Get match details
    path('<int:match_id>/', views.get_match_view, name='get_match'),
]