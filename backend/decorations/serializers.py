from rest_framework import serializers
from .models import DecorationPackage


class DecorationPackageSerializer(serializers.ModelSerializer):
    class Meta:
        model = DecorationPackage
        fields = '__all__'
        read_only_fields = ('tenant', 'created_at', 'updated_at')

    def validate_included_items(self, value):
        if value is None:
            return []
        if not isinstance(value, list):
            raise serializers.ValidationError('included_items must be a list of strings.')
        cleaned = []
        for item in value:
            if not isinstance(item, str):
                raise serializers.ValidationError('Each included item must be a string.')
            s = item.strip()
            if s:
                cleaned.append(s)
        return cleaned

    def validate(self, attrs):
        request = self.context.get('request')
        tenant = getattr(request.user, 'tenant', None) if request else None
        name = (attrs.get('name') or (self.instance and self.instance.name) or '').strip()
        if not name:
            return attrs
        if tenant:
            qs = DecorationPackage.objects.filter(tenant=tenant, name__iexact=name)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError({'name': 'A package with this name already exists.'})
        attrs['name'] = name
        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request.user, 'tenant'):
            validated_data['tenant'] = request.user.tenant
        return super().create(validated_data)
