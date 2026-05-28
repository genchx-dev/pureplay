import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token

User = get_user_model()
print("All users:")
for u in User.objects.all():
    print(f"- {u.username} (ID: {u.id})")

print("\nAll tokens:")
for t in Token.objects.all():
    print(f"- User: {t.user.username}, Token: {t.key}")
