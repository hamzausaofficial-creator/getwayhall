"""
Create a Guest House tenant + admin user (separate from Marriage Hall login).

Usage (from backend/ with venv active):
  python create_guesthouse_admin.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hallora_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from core.models import Tenant, UserSettings

User = get_user_model()

TENANT_NAME = 'Gateway Guest House'
SUBDOMAIN = 'gateway-guesthouse'
USERNAME = 'gh_admin'
EMAIL = 'gh_admin@gateway.com'
PASSWORD = 'gh_admin123'

tenant, created = Tenant.objects.get_or_create(
    subdomain=SUBDOMAIN,
    defaults={'name': TENANT_NAME, 'plan_type': 'STANDARD'},
)
if not created:
    tenant.name = TENANT_NAME
    tenant.save(update_fields=['name'])

user, u_created = User.objects.get_or_create(
    username=USERNAME,
    defaults={
        'email': EMAIL,
        'tenant': tenant,
        'role': 'ADMIN',
        'app_type': 'GUEST_HOUSE',
        'first_name': 'Guest',
        'last_name': 'House Admin',
    },
)
user.tenant = tenant
user.role = 'ADMIN'
user.app_type = 'GUEST_HOUSE'
user.set_password(PASSWORD)
user.is_staff = True
user.save()

UserSettings.objects.get_or_create(user=user)

action = 'Created' if u_created else 'Updated'
print(f'{action} Guest House tenant: {tenant.name} ({tenant.subdomain})')
print(f'Login - username: {USERNAME} / password: {PASSWORD}')
print('Opens Guest House app only (not Marriage Hall).')
