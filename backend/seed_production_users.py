"""
Seed production admin users for Marriage Hall + Guest House.

Usage:
  set DATABASE_URL=postgresql://...
  cd backend
  python seed_production_users.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hallora_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from core.models import Tenant, UserSettings

User = get_user_model()

PASSWORD = 'admin123'

USERS = [
    {
        'tenant_name': 'Gateway Marriage Hall',
        'subdomain': 'gateway',
        'plan_type': 'premium',
        'username': 'admin',
        'email': 'admin@gateway.com',
        'app_type': 'MARRIAGE_HALL',
        'first_name': 'Admin',
        'last_name': 'Hall',
        'is_superuser': True,
    },
    {
        'tenant_name': 'Gateway Guest House',
        'subdomain': 'gateway-guesthouse',
        'plan_type': 'STANDARD',
        'username': 'gh_admin',
        'email': 'gh_admin@gateway.com',
        'app_type': 'GUEST_HOUSE',
        'first_name': 'Admin',
        'last_name': 'Guest House',
        'is_superuser': False,
    },
]


def upsert_user(spec):
    tenant, _ = Tenant.objects.get_or_create(
        subdomain=spec['subdomain'],
        defaults={
            'name': spec['tenant_name'],
            'plan_type': spec['plan_type'],
        },
    )
    tenant.name = spec['tenant_name']
    tenant.plan_type = spec['plan_type']
    tenant.save(update_fields=['name', 'plan_type'])

    user, created = User.objects.get_or_create(
        username=spec['username'],
        defaults={
            'email': spec['email'],
            'tenant': tenant,
            'role': 'ADMIN',
            'app_type': spec['app_type'],
            'first_name': spec['first_name'],
            'last_name': spec['last_name'],
            'is_staff': True,
            'is_superuser': spec['is_superuser'],
        },
    )
    user.email = spec['email']
    user.tenant = tenant
    user.role = 'ADMIN'
    user.app_type = spec['app_type']
    user.first_name = spec['first_name']
    user.last_name = spec['last_name']
    user.is_staff = True
    user.is_superuser = spec['is_superuser']
    user.set_password(PASSWORD)
    user.save()

    UserSettings.objects.get_or_create(user=user)

    action = 'Created' if created else 'Updated'
    print(f'{action}: {spec["app_type"]} | username={spec["username"]} | password={PASSWORD}')
    return user


if __name__ == '__main__':
    for spec in USERS:
        upsert_user(spec)

    print('Done. Marriage Hall: admin / admin123')
    print('Done. Guest House: gh_admin / admin123 (login via Guest House portal)')
    print('Django admin: https://YOUR-RAILWAY-URL/admin/  (use admin / admin123)')
