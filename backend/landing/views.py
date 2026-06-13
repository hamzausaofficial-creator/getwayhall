from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import HeroSlide, GalleryImage, Testimonial, LandingStatistic, LandingFAQ
from .serializers import (
    HeroSlideSerializer,
    GalleryImageSerializer,
    TestimonialSerializer,
    LandingStatisticSerializer,
    LandingFAQSerializer,
)
from .defaults import get_default_landing_payload
from .live_stats import get_live_hero_statistics, get_live_trust_statistics, get_live_statistics


class LandingLiveStatsView(APIView):
    """Public live landing metrics - polled by landing page."""

    permission_classes = [AllowAny]

    def get(self, request):
        return Response(get_live_statistics())


class LandingContentView(APIView):
    """Public landing page CMS content - no auth required."""

    permission_classes = [AllowAny]

    def get(self, request):
        hero_slides = HeroSlide.objects.filter(is_active=True)
        gallery = GalleryImage.objects.filter(is_active=True)
        testimonials = Testimonial.objects.filter(is_active=True)
        statistics = LandingStatistic.objects.filter(is_active=True)
        faqs = LandingFAQ.objects.filter(is_active=True)

        ctx = {'request': request}
        stats_qs = LandingStatisticSerializer(statistics, many=True, context=ctx).data
        stats_grouped = {
            'hero': get_live_hero_statistics(),
            'trust': get_live_trust_statistics(),
            'success': [s for s in stats_qs if s['section'] == 'success'],
        }

        payload = {
            'hero_slides': HeroSlideSerializer(hero_slides, many=True, context=ctx).data,
            'gallery': GalleryImageSerializer(gallery, many=True, context=ctx).data,
            'testimonials': TestimonialSerializer(testimonials, many=True, context=ctx).data,
            'statistics': stats_grouped,
            'faqs': LandingFAQSerializer(faqs, many=True, context=ctx).data,
        }

        if not any([
            payload['hero_slides'],
            payload['gallery'],
            payload['testimonials'],
            stats_grouped['trust'] or stats_grouped['success'],
            payload['faqs'],
        ]):
            default_payload = get_default_landing_payload(request)
            default_payload['statistics']['hero'] = get_live_hero_statistics()
            default_payload['statistics']['trust'] = get_live_trust_statistics()
            return Response(default_payload)

        if not payload['hero_slides']:
            payload['hero_slides'] = get_default_landing_payload(request)['hero_slides']
        if not stats_grouped['success']:
            payload['statistics']['success'] = get_default_landing_payload(request)['statistics'].get('success', [])
        if not payload['faqs']:
            payload['faqs'] = get_default_landing_payload(request)['faqs']
        if not payload['testimonials']:
            payload['testimonials'] = get_default_landing_payload(request)['testimonials']
        if not payload['gallery']:
            payload['gallery'] = get_default_landing_payload(request)['gallery']

        return Response(payload)
