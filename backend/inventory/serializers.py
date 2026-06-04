from django.db.models import Sum
from rest_framework import serializers
from .models import InventoryItem, BookingInventoryItem


class InventoryItemSerializer(serializers.ModelSerializer):
    allocated_quantity = serializers.SerializerMethodField()

    class Meta:
        model = InventoryItem
        fields = '__all__'

    def get_allocated_quantity(self, obj):
        return obj.booking_allocations.aggregate(total=Sum('quantity_used'))['total'] or 0


class BookingInventoryItemSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='inventory_item.name', read_only=True)
    item_unit = serializers.CharField(source='inventory_item.unit', read_only=True)
    booking_event = serializers.CharField(source='booking.event_name', read_only=True)

    class Meta:
        model = BookingInventoryItem
        fields = '__all__'
        read_only_fields = ['tenant']

    def validate(self, attrs):
        item = attrs.get('inventory_item') or (self.instance and self.instance.inventory_item)
        qty = attrs.get('quantity_used', self.instance.quantity_used if self.instance else 0)
        if item and qty > item.quantity:
            raise serializers.ValidationError(
                {'quantity_used': f'Only {item.quantity} {item.unit} available in stock.'}
            )
        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        booking = validated_data['booking']
        if request and getattr(request.user, 'tenant_id', None):
            validated_data['tenant'] = request.user.tenant
        elif booking.tenant_id:
            validated_data['tenant'] = booking.tenant
        return super().create(validated_data)
