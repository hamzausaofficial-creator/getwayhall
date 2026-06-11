from django.db import models


class HeroSlide(models.Model):
    title = models.CharField(max_length=200)
    subtitle = models.TextField(blank=True, default='')
    background_image = models.ImageField(upload_to='landing/hero/', blank=True, null=True)
    button_text = models.CharField(max_length=80, default='Get Started')
    button_link = models.CharField(max_length=255, default='/login')
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['sort_order', 'id']

    def __str__(self):
        return self.title


class GalleryImage(models.Model):
    CATEGORY_CHOICES = (
        ('MARRIAGE_HALL', 'Marriage Hall'),
        ('WEDDING_STAGE', 'Wedding Stage'),
        ('GUEST_ROOM', 'Guest Room'),
        ('DINING', 'Dining Area'),
        ('RECEPTION', 'Reception Area'),
        ('OUTDOOR', 'Outdoor Event Area'),
        ('OTHER', 'Other'),
    )

    image = models.ImageField(upload_to='landing/gallery/', blank=True, null=True)
    title = models.CharField(max_length=150)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default='MARRIAGE_HALL')
    sort_order = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['sort_order', 'id']

    def __str__(self):
        return self.title


class Testimonial(models.Model):
    customer_name = models.CharField(max_length=120)
    customer_photo = models.ImageField(upload_to='landing/testimonials/', blank=True, null=True)
    designation = models.CharField(max_length=150, blank=True, default='')
    review = models.TextField()
    rating = models.PositiveSmallIntegerField(default=5)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['sort_order', 'id']

    def __str__(self):
        return self.customer_name


class LandingStatistic(models.Model):
    SECTION_CHOICES = (
        ('hero', 'Hero - below slider'),
        ('trust', 'Trust & Social Proof'),
        ('success', 'Success Statistics'),
    )

    section = models.CharField(max_length=20, choices=SECTION_CHOICES)
    label = models.CharField(max_length=120)
    value_display = models.CharField(max_length=40, help_text='Shown text e.g. 98% or 10,000+')
    value_number = models.PositiveIntegerField(default=0, help_text='Used for animated counters')
    suffix = models.CharField(max_length=10, blank=True, default='', help_text='e.g. + or %')
    sort_order = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['section', 'sort_order', 'id']

    def __str__(self):
        return f'{self.get_section_display()}: {self.label}'


class LandingFAQ(models.Model):
    question = models.CharField(max_length=300)
    answer = models.TextField()
    sort_order = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['sort_order', 'id']
        verbose_name = 'FAQ'
        verbose_name_plural = 'FAQs'

    def __str__(self):
        return self.question[:80]
