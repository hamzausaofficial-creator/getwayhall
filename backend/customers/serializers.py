from rest_framework import serializers
from django.db.models import Sum, F
from django.db.models.functions import Greatest
from decimal import Decimal
from .models import Customer
from .phone import format_pk_phone, validate_pk_phone


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

    def _is_guest_house_request(self):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        return getattr(user, 'app_type', '') == 'GUEST_HOUSE'

    def validate(self, attrs):
        attrs = self._sync_legacy_names(attrs)

        is_minor = bool(attrs.get('is_minor', self.instance.is_minor if self.instance else False))
        attrs['is_minor'] = is_minor

        linked_primary = attrs.get('linked_primary')
        if linked_primary is None and self.instance:
            linked_primary = self.instance.linked_primary
        if is_minor and linked_primary and 'linked_primary' not in attrs:
            attrs['linked_primary'] = linked_primary

        phone = (attrs.get('phone') if 'phone' in attrs else (self.instance.phone if self.instance else '')) or ''
        phone = str(phone).strip()
        if is_minor:
            if not phone and linked_primary:
                phone = (linked_primary.phone or '').strip()
            if not phone:
                phone = '—'
            attrs['phone'] = phone
        elif not phone:
            raise serializers.ValidationError({'phone': 'Phone number is required.'})
        else:
            phone_error = validate_pk_phone(phone)
            if phone_error:
                raise serializers.ValidationError({'phone': phone_error})
            attrs['phone'] = format_pk_phone(phone)

        cnic = (attrs.get('cnic') if 'cnic' in attrs else (self.instance.cnic if self.instance else '')) or ''
        cnic = str(cnic).strip()
        if is_minor:
            attrs['cnic'] = ''
        elif self._is_guest_house_request() and not cnic:
            raise serializers.ValidationError({'cnic': 'CNIC is required.'})
        else:
            attrs['cnic'] = cnic

        if 'address' in attrs and attrs['address'] is not None:
            attrs['address'] = str(attrs['address']).strip() or None

        if is_minor and not (attrs.get('address') or (self.instance.address if self.instance else '')):
            raise serializers.ValidationError({'address': 'Address is required for guests under 18.'})

        return attrs

    def get_outstanding_balance(self, obj):
        hall_due = obj.bookings.exclude(booking_status='CANCELLED').aggregate(
            total=Sum('remaining_balance')
        )['total'] or Decimal('0')
        gh_total = obj.gh_stays.exclude(status='CANCELLED').annotate(
            due=Greatest(F('total_amount') - F('advance_paid'), Decimal('0'))
        ).aggregate(total=Sum('due'))['total'] or Decimal('0')
        return float(max(Decimal('0'), hall_due) + max(Decimal('0'), gh_total))

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request.user, 'tenant') and request.user.tenant:
            validated_data['tenant'] = request.user.tenant
        return super().create(validated_data)
