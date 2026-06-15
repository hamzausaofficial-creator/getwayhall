from django.contrib import admin

from .models import HeroSlide, GalleryImage, Testimonial, LandingStatistic, LandingFAQ


@admin.register(HeroSlide)
class HeroSlideAdmin(admin.ModelAdmin):
    list_display = ('title', 'is_active', 'sort_order', 'button_text', 'created_at')
    list_editable = ('is_active', 'sort_order')
    list_filter = ('is_active',)
    search_fields = ('title', 'subtitle')
    fieldsets = (
        (None, {
            'fields': ('title', 'subtitle', 'button_text', 'button_link', 'is_active', 'sort_order'),
            'description': (
                'Controls hero <strong>headline text and buttons</strong> only. '
                'The scrolling hero images are fixed in the app and are not changed from admin uploads.'
            ),
        }),
        ('Legacy (unused on site)', {
            'classes': ('collapse',),
            'fields': ('background_image',),
            'description': 'Background image is not shown on the current landing hero.',
        }),
    )


@admin.register(GalleryImage)
class GalleryImageAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'has_image', 'is_active', 'sort_order', 'created_at')
    list_editable = ('is_active', 'sort_order')
    list_filter = ('category', 'is_active')
    search_fields = ('title',)
    readonly_fields = ('image_preview',)

    fieldsets = (
        (None, {
            'fields': ('title', 'category', 'image', 'image_preview', 'is_active', 'sort_order'),
            'description': (
                'Upload a photo for the <strong>Gallery section</strong> on the landing page. '
                'Hero marquee images stay fixed and are not changed from here. '
                'On Railway production, set <code>CLOUDINARY_URL</code> in env so uploads persist after deploy.'
            ),
        }),
    )

    @admin.display(boolean=True, description='Has file')
    def has_image(self, obj):
        return bool(obj.image)

    @admin.display(description='Preview')
    def image_preview(self, obj):
        if not obj.image:
            return '—'
        from django.utils.html import format_html
        return format_html('<img src="{}" style="max-height:120px;border-radius:8px;" alt="" />', obj.image.url)


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
