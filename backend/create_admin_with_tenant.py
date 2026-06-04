import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hallora_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from core.models import Tenant

User = get_user_model()

# Delete ALL users and tenants to make it clean
User.objects.all().delete()
Tenant.objects.all().delete()
print('Deleted all users and tenants.')

# Create a tenant
tenant = Tenant.objects.create(name='Gateway Marriage Hall', subdomain='gateway', plan_type='premium')
print(f'Created tenant: {tenant.name}')

# Create one new superuser with ADMIN role and linked to the tenant
u = User.objects.create_superuser(
    username='admin',
    email='admin@gateway.com',
    password='admin123',
    role='ADMIN',
    tenant=tenant,
    first_name='Admin',
    last_name='User'
)
print('Created new superuser/admin linked to tenant. Login username: admin / password: admin123')
