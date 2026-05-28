import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()
users = User.objects.exclude(username__startswith='bot_').order_by('-last_login')

print("Recently logged-in users:")
for u in users:
    print(f"- Username: {u.username}, Last Login: {u.last_login}")
