import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from django.contrib.auth import get_user_model
from apps.tournaments.views import list_tournaments

User = get_user_model()
u = User.objects.get(username="smoke1779442567")
factory = APIRequestFactory()
req = factory.get("/api/tournaments/")
force_authenticate(req, user=u)

res = list_tournaments(req)
print("API Response:")
import pprint
pprint.pprint(res.data)
