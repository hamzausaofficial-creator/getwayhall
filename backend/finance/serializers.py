from rest_framework import serializers
from .models import Payment, Expense

class PaymentSerializer(serializers.ModelSerializer):
    booking_event_name = serializers.ReadOnlyField(source='booking.event_name')

    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['tenant', 'payment_date']

    def create(self, validated_data):
        # When a payment is made, update the booking's advance_paid
        payment = super().create(validated_data)
        booking = payment.booking
        if payment.status == 'COMPLETED':
            booking.advance_paid += payment.amount
            booking.save()
        return payment

class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = '__all__'
        read_only_fields = ['tenant', 'created_by', 'created_at']

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)
