from decimal import Decimal

from rest_framework import serializers
from django.db.models import Q, Sum
from .models import Room, StayBooking, StayPayment, GhExpense


class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = [
            'id', 'room_number', 'room_type', 'beds', 'price_per_night',
            'description', 'image', 'status', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class StayPaymentSerializer(serializers.ModelSerializer):
    stay_ref = serializers.CharField(source='stay.booking_ref', read_only=True)
    customer_name = serializers.SerializerMethodField()
    room_number = serializers.CharField(source='stay.room.room_number', read_only=True)
    stay_total = serializers.DecimalField(source='stay.total_amount', max_digits=12, decimal_places=2, read_only=True)
    stay_paid = serializers.DecimalField(source='stay.advance_paid', max_digits=12, decimal_places=2, read_only=True)
    stay_remaining = serializers.DecimalField(source='stay.remaining_balance', max_digits=12, decimal_places=2, read_only=True)
    check_in = serializers.DateField(source='stay.check_in', read_only=True)
    check_out = serializers.DateField(source='stay.check_out', read_only=True)
    recorded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = StayPayment
        fields = '__all__'
        read_only_fields = ['tenant', 'payment_date', 'recorded_by']

    def get_customer_name(self, obj):
        if obj.stay and obj.stay.customer:
            return obj.stay.customer.display_name
        return ''

    def get_recorded_by_name(self, obj):
        if not obj.recorded_by:
            return ''
        user = obj.recorded_by
        name = f'{user.first_name or ""} {user.last_name or ""}'.strip()
        return name or user.username

    def validate(self, attrs):
        stay = attrs.get('stay') or getattr(self.instance, 'stay', None)
        amount = attrs.get('amount', getattr(self.instance, 'amount', None))
        status = attrs.get('status', getattr(self.instance, 'status', 'COMPLETED'))
        if stay and amount is not None and status == 'COMPLETED':
            amt = Decimal(str(amount))
            paid = stay.payments.filter(status='COMPLETED').aggregate(t=Sum('amount'))['t'] or Decimal('0')
            if self.instance:
                paid -= Decimal(str(self.instance.amount))
            if amt < 0:
                if abs(amt) > max(paid, Decimal('0')):
                    raise serializers.ValidationError({
                        'amount': f'Refund cannot exceed amount paid (Rs {max(paid, Decimal("0"))}).',
                    })
            else:
                remaining = Decimal(str(stay.total_amount)) - max(paid, Decimal('0'))
                if amt > remaining:
                    raise serializers.ValidationError({
                        'amount': f'Amount exceeds remaining balance (Rs {remaining}).',
                    })
        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['recorded_by'] = request.user
            if request.user.tenant_id:
                validated_data['tenant'] = request.user.tenant
        return super().create(validated_data)


class GhExpenseSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = GhExpense
        fields = '__all__'
        read_only_fields = ['tenant', 'created_by', 'created_at', 'created_by_name']

    def get_created_by_name(self, obj):
        if not obj.created_by_id:
            return ''
        user = obj.created_by
        name = f'{user.first_name or ""} {user.last_name or ""}'.strip()
        return name or user.username

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['created_by'] = request.user
            if request.user.tenant_id:
                validated_data['tenant'] = request.user.tenant
        return super().create(validated_data)


class StayBookingSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    customer_phone = serializers.CharField(source='customer.phone', read_only=True)
    room_number = serializers.CharField(source='room.room_number', read_only=True)
    room_type = serializers.CharField(source='room.room_type', read_only=True)
    price_per_night = serializers.DecimalField(source='room.price_per_night', max_digits=12, decimal_places=2, read_only=True)
    nights = serializers.IntegerField(read_only=True)
    remaining_balance = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    advance_payment_method = serializers.ChoiceField(
        choices=StayPayment.METHOD_CHOICES,
        default='CASH',
        write_only=True,
        required=False,
    )

    class Meta:
        model = StayBooking
        fields = [
            'id', 'booking_ref', 'customer', 'customer_name', 'customer_phone',
            'room', 'room_number', 'room_type', 'price_per_night',
            'check_in', 'check_out', 'guests_count', 'nights', 'total_amount',
            'advance_paid', 'advance_payment_method', 'remaining_balance',
            'status', 'payment_status', 'notes',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'booking_ref', 'customer_name', 'customer_phone', 'room_number',
            'room_type', 'price_per_night', 'nights', 'remaining_balance',
            'total_amount', 'advance_paid', 'payment_status', 'created_at', 'updated_at',
        ]

    def get_customer_name(self, obj):
        return obj.customer.display_name if obj.customer_id else ''

    def validate(self, attrs):
        check_in = attrs.get('check_in') or getattr(self.instance, 'check_in', None)
        check_out = attrs.get('check_out') or getattr(self.instance, 'check_out', None)
        room = attrs.get('room') or getattr(self.instance, 'room', None)
        if check_in and check_out and check_out <= check_in:
            raise serializers.ValidationError({'check_out': 'Check-out must be after check-in.'})
        if room and check_in and check_out and room.status != 'ACTIVE':
            raise serializers.ValidationError({'room': 'Selected room is not available for booking.'})
        if room and check_in and check_out:
            qs = StayBooking.objects.filter(room=room).exclude(status='CANCELLED').filter(
                Q(check_in__lt=check_out) & Q(check_out__gt=check_in)
            )
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError({
                    'room': f'Room {room.room_number} is already booked for overlapping dates.',
                })
        advance = attrs.get('advance_paid')
        if advance is not None and not self.instance and room and check_in and check_out:
            nights = max((check_out - check_in).days, 1)
            total = room.price_per_night * nights
            if Decimal(str(advance)) > total:
                raise serializers.ValidationError({
                    'advance_paid': f'Advance cannot exceed stay total (Rs {total}).',
                })
        return attrs

    def create(self, validated_data):
        validated_data.pop('advance_payment_method', None)
        return super().create(validated_data)
