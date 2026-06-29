from django.db import models
from core.models import Tenant

class Customer(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='customers', null=True, blank=True)
    full_name = models.CharField(max_length=200, blank=True, default='')
    cnic = models.CharField(max_length=20, blank=True, default='')
    first_name = models.CharField(max_length=100, blank=True, default='')
    last_name = models.CharField(max_length=100, blank=True, default='')
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20)
    address = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    is_minor = models.BooleanField(default=False)
    linked_primary = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='linked_companions',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['phone']),
        ]

    @property
    def display_name(self):
        if self.full_name and self.full_name.strip():
            return self.full_name.strip()
        return f"{self.first_name} {self.last_name}".strip() or 'Client'

    def __str__(self):
        return self.display_name
