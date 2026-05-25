from django.urls import path, include
from apps.users.views import RegisterView, LoginView
from apps.auth_extras.views import get_profile

urlpatterns = [
    # Auth endpoints (frontend expects /api/auth/...)
    path('api/auth/register/', RegisterView.as_view(), name='auth_register'),
    path('api/auth/login/', LoginView.as_view(), name='auth_login'),
    path('api/auth/profile/', get_profile, name='auth_profile'),
    
    # Original user endpoints (backward compatibility)
    path('api/users/', include('apps.users.urls')),
    
    # Other endpoints
    path('api/matches/', include('apps.matches.urls')),
    path('api/wallet/', include('apps.wallet.urls')),
    path('api/matchmaking/', include('apps.matchmaking.urls')),
    path('api/tournaments/', include('apps.tournaments.urls')),
    path('api/rankings/', include('apps.rankings.urls')),
    path('api/auth/', include('apps.users.urls')),          # registration/login
    ]