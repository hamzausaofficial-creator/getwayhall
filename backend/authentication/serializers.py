from rest_framework import serializers
from django.contrib.auth import get_user_model
from core.models import Tenant

User = get_user_model()

class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = ['id', 'name', 'subdomain', 'plan_type']

class UserSerializer(serializers.ModelSerializer):
    tenant = TenantSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'email', 'role', 'tenant', 'first_name', 'last_name']

class StaffSerializer(serializers.ModelSerializer):
    """Serializer for creating and listing staff members."""
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'role']
        read_only_fields = ['id']

    def create(self, validated_data):
        user = User(**validated_data)
        user.set_password('staff123')
        user.save()
        return user

class RegisterSerializer(serializers.ModelSerializer):
    tenant_name = serializers.CharField(write_only=True)
    subdomain = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'password', 'first_name', 'last_name', 'tenant_name', 'subdomain']

    def create(self, validated_data):
        tenant_name = validated_data.pop('tenant_name')
        subdomain = validated_data.pop('subdomain')
        password = validated_data.pop('password')
        
        # Create Tenant
        tenant = Tenant.objects.create(name=tenant_name, subdomain=subdomain)
        
        # Create User as Admin for this tenant
        user = User.objects.create_user(
            tenant=tenant,
            role='ADMIN',
            **validated_data
        )
        user.set_password(password)
        user.save()
        return user
