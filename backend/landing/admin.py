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
    list_display = ('title', 'category', 'has_image', 'file_on_storage', 'is_active', 'sort_order', 'created_at')
    list_editable = ('is_active', 'sort_order')
    list_filter = ('category', 'is_active')
    search_fields = ('title',)
    readonly_fields = ('image_preview',)

    fieldsets = (
        (None, {
            'fields': ('title', 'category', 'image', 'image_preview', 'is_active', 'sort_order'),
            'description': (
                'Upload a photo for the <strong>Gallery section</strong> on the landing page. '
                'Default AI images are shown until you upload your own here. '
                'On Railway, set <code>CLOUDINARY_URL</code> or attach a volume so custom uploads persist.'
            ),
        }),
    )

    @admin.display(boolean=True, description='Has file')
    def has_image(self, obj):
        return bool(obj.image)

    @admin.display(boolean=True, description='Stored')
    def file_on_storage(self, obj):
        if not obj.image or not obj.image.name:
            return False
        try:
            return obj.image.storage.exists(obj.image.name)
        except Exception:
            return False

    @admin.display(description='Preview')
    def image_preview(self, obj):
        if not obj.image:
            return '—'
        if not self.file_on_storage(obj):
            return 'File missing on server — re-upload after setting CLOUDINARY_URL or a Railway volume.'
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
