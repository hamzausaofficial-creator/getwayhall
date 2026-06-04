from rest_framework import serializers
from django.db.models import Sum
from decimal import Decimal
from .models import Customer


class CustomerSerializer(serializers.ModelSerializer):
    outstanding_balance = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = '__all__'
        read_only_fields = ['tenant', 'created_at', 'first_name', 'last_name', 'outstanding_balance']
        extra_kwargs = {
            'email': {'required': False, 'allow_blank': True, 'allow_null': True},
            'cnic': {'required': False, 'allow_blank': True},
            'full_name': {'required': True},
        }

    def _sync_legacy_names(self, attrs):
        full_name = (attrs.get('full_name') or '').strip()
        if not full_name and self.instance:
            full_name = (self.instance.full_name or '').strip() or self.instance.display_name
        if not full_name:
            raise serializers.ValidationError({'full_name': 'Full name is required.'})
        attrs['full_name'] = full_name
        attrs['first_name'] = full_name
        attrs['last_name'] = ''
        email = attrs.get('email')
        if email is not None and str(email).strip() == '':
            attrs['email'] = None
        return attrs

    def validate(self, attrs):
        return self._sync_legacy_names(attrs)

    def get_outstanding_balance(self, obj):
        total = obj.bookings.exclude(booking_status='CANCELLED').aggregate(
            total=Sum('remaining_balance')
        )['total'] or Decimal('0')
        return float(max(Decimal('0'), total))

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request.user, 'tenant') and request.user.tenant:
            validated_data['tenant'] = request.user.tenant
        return super().create(validated_data)
