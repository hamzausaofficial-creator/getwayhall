import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hallora_backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

u = User.objects.filter(is_superuser=True).first()
if u:
    u.username = 'admin'
    u.email = 'admin@gateway.com'
    u.set_password('admin123')
    u.save()
    print('Updated superuser. Login: username admin / password admin123')
else:
    User.objects.create_superuser(
        username='admin',
        email='admin@gateway.com',
        password='admin123',
    )
    print('Created superuser. Login: username admin / password admin123')
