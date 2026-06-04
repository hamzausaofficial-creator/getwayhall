from django.db import models
from core.models import Tenant

class InventoryItem(models.Model):
    CATEGORY_CHOICES = [
        ('FOOD', 'Food & Beverage'),
        ('DECORATION', 'Decoration'),
        ('UTENSIL', 'Utensils & Cutlery'),
        ('ELECTRONIC', 'Electronics & Lighting'),
        ('FURNITURE', 'Furniture'),
        ('OTHER', 'Other'),
    ]
    STATUS_CHOICES = [
        ('IN_STOCK', 'In Stock'),
        ('LOW_STOCK', 'Low Stock'),
        ('OUT_OF_STOCK', 'Out of Stock'),
    ]
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='inventory_items', null=True, blank=True)
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='OTHER')
    quantity = models.IntegerField(default=0)
    unit = models.CharField(max_length=50, help_text="e.g., kg, pcs, liters, units")
    price_per_unit = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    description = models.TextField(blank=True)
    last_restocked = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='IN_STOCK')

    def __str__(self):
        return f"{self.name} ({self.quantity} {self.unit})"


class BookingInventoryItem(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='booking_inventory', null=True, blank=True)
    booking = models.ForeignKey('bookings.Booking', on_delete=models.CASCADE, related_name='inventory_items')
    inventory_item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE, related_name='booking_allocations')
    quantity_used = models.PositiveIntegerField(default=1)
    notes = models.CharField(max_length=255, blank=True, default='')

    class Meta:
        unique_together = [['booking', 'inventory_item']]

    def __str__(self):
        return f"{self.booking_id} — {self.inventory_item.name} x{self.quantity_used}"
