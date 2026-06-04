from django.db import models
from core.models import Tenant


class DecorationPackage(models.Model):
    """Sellable decoration bundle for events (stage, lighting, florals, etc.)."""

    TIER_CHOICES = [
        ('ESSENTIAL', 'Essential'),
        ('CLASSIC', 'Classic'),
        ('PREMIUM', 'Premium'),
        ('ROYAL', 'Royal'),
        ('CUSTOM', 'Custom quote'),
    ]

    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='decoration_packages',
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=200)
    tier = models.CharField(max_length=20, choices=TIER_CHOICES, default='CLASSIC')
    description = models.TextField(blank=True)
    included_items = models.JSONField(
        default=list,
        help_text='List of line items included in this package, e.g. stage backdrop, LED panels',
    )
    base_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    setup_hours = models.PositiveSmallIntegerField(
        default=4,
        help_text='Estimated on-site setup time',
    )
    is_active = models.BooleanField(default=True)
    display_order = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order', 'name']
        constraints = [
            models.UniqueConstraint(
                fields=['tenant', 'name'],
                name='decoration_pkg_unique_name_per_tenant',
            ),
        ]

    def __str__(self):
        return f"{self.name} ({self.get_tier_display()})"
