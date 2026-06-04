import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hallora_backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Delete ALL users
User.objects.all().delete()
print('Deleted all users.')

# Create one new superuser
u = User.objects.create_superuser(email='admin', password='admin123')
print('Created new superuser admin / admin123')
