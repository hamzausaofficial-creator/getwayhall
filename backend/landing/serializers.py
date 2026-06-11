from rest_framework import serializers

from .models import HeroSlide, GalleryImage, Testimonial, LandingStatistic, LandingFAQ


def _abs_url(request, file_field):
    if not file_field:
        return None
    if request:
        return request.build_absolute_uri(file_field.url)
    return file_field.url


class HeroSlideSerializer(serializers.ModelSerializer):
    background_image_url = serializers.SerializerMethodField()

    class Meta:
        model = HeroSlide
        fields = [
            'id', 'title', 'subtitle', 'background_image_url',
            'button_text', 'button_link', 'sort_order',
        ]

    def get_background_image_url(self, obj):
        return _abs_url(self.context.get('request'), obj.background_image)


class GalleryImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    category_label = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = GalleryImage
        fields = ['id', 'title', 'category', 'category_label', 'image_url', 'sort_order']

    def get_image_url(self, obj):
        return _abs_url(self.context.get('request'), obj.image)


class TestimonialSerializer(serializers.ModelSerializer):
    customer_photo_url = serializers.SerializerMethodField()

    class Meta:
        model = Testimonial
        fields = [
            'id', 'customer_name', 'customer_photo_url', 'designation',
            'review', 'rating', 'sort_order',
        ]

    def get_customer_photo_url(self, obj):
        return _abs_url(self.context.get('request'), obj.customer_photo)


class LandingStatisticSerializer(serializers.ModelSerializer):
    class Meta:
        model = LandingStatistic
        fields = [
            'id', 'section', 'label', 'value_display',
            'value_number', 'suffix', 'sort_order',
        ]


class LandingFAQSerializer(serializers.ModelSerializer):
    class Meta:
        model = LandingFAQ
        fields = ['id', 'question', 'answer', 'sort_order']
