from django.contrib import admin

from .models import HeroSlide, GalleryImage, Testimonial, LandingStatistic, LandingFAQ


@admin.register(HeroSlide)
class HeroSlideAdmin(admin.ModelAdmin):
    list_display = ('title', 'is_active', 'sort_order', 'button_text', 'created_at')
    list_editable = ('is_active', 'sort_order')
    list_filter = ('is_active',)
    search_fields = ('title', 'subtitle')


@admin.register(GalleryImage)
class GalleryImageAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'is_active', 'sort_order', 'created_at')
    list_editable = ('is_active', 'sort_order')
    list_filter = ('category', 'is_active')
    search_fields = ('title',)


@admin.register(Testimonial)
class TestimonialAdmin(admin.ModelAdmin):
    list_display = ('customer_name', 'designation', 'rating', 'is_active', 'sort_order')
    list_editable = ('is_active', 'sort_order', 'rating')
    list_filter = ('is_active', 'rating')
    search_fields = ('customer_name', 'review')


@admin.register(LandingStatistic)
class LandingStatisticAdmin(admin.ModelAdmin):
    list_display = ('label', 'section', 'value_display', 'value_number', 'is_active', 'sort_order')
    list_editable = ('is_active', 'sort_order', 'value_display', 'value_number')
    list_filter = ('section', 'is_active')
    search_fields = ('label',)


@admin.register(LandingFAQ)
class LandingFAQAdmin(admin.ModelAdmin):
    list_display = ('question', 'is_active', 'sort_order', 'created_at')
    list_editable = ('is_active', 'sort_order')
    list_filter = ('is_active',)
    search_fields = ('question', 'answer')
