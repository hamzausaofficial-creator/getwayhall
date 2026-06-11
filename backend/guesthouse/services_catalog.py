"""Default Guest House add-on services and tenant seeding."""

DEFAULT_GH_SERVICES = (
    ('AC', 'Air conditioning (AC)', '500.00', 'PER_NIGHT', 10),
    ('EXTRA_BEDDING', 'Extra bedding', '300.00', 'PER_STAY', 20),
    ('BREAKFAST', 'Breakfast', '150.00', 'PER_GUEST', 30),
    ('LAUNDRY', 'Laundry', '200.00', 'PER_STAY', 40),
    ('ROOM_SERVICE', 'Room service', '400.00', 'PER_STAY', 50),
    ('PARKING', 'Parking', '100.00', 'PER_NIGHT', 60),
    ('WIFI_PREMIUM', 'Premium WiFi', '50.00', 'PER_NIGHT', 70),
)


def ensure_tenant_gh_services(tenant):
    """Create missing add-on service rows for a tenant."""
    from .models import GuestHouseService

    if not tenant:
        return
    for code, label, price, pricing_unit, sort_order in DEFAULT_GH_SERVICES:
        GuestHouseService.objects.get_or_create(
            tenant=tenant,
            code=code,
            defaults={
                'label': label,
                'price': price,
                'pricing_unit': pricing_unit,
                'sort_order': sort_order,
                'is_active': True,
            },
        )
