from rest_framework import serializers
from .models import Venue

class VenueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Venue
        fields = '__all__'
        read_only_fields = ['tenant', 'created_at', 'updated_at']

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            if hasattr(request.user, 'tenant') and request.user.tenant:
                validated_data['tenant'] = request.user.tenant
        return super().create(validated_data)
