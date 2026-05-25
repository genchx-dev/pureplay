import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')

django_asgi_app = get_asgi_application()

# Import both routing files
from apps.matches.routing import websocket_urlpatterns as match_ws
from apps.matchmaking.routing import websocket_urlpatterns as challenge_ws

# Combine them
combined_websocket_urlpatterns = match_ws + challenge_ws

application = ProtocolTypeRouter({
    'http': django_asgi_app,
    'websocket': AuthMiddlewareStack(
        URLRouter(combined_websocket_urlpatterns)
    ),
})