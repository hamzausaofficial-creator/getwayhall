"""Default amenity catalog for guest-house tenants."""

DEFAULT_AMENITIES = [
    ('wifi', 'Wi‑Fi'),
    ('ac', 'Air conditioning'),
    ('tv', 'TV'),
    ('minibar', 'Minibar'),
    ('heater', 'Heater'),
    ('wardrobe', 'Wardrobe'),
    ('balcony', 'Balcony'),
    ('attached_bath', 'Attached bathroom'),
    ('hot_water', 'Hot water'),
    ('parking', 'Parking'),
]


def ensure_tenant_gh_amenities(tenant):
    from .models import Amenity

    if not tenant:
        return
    existing = set(
        Amenity.objects.filter(tenant=tenant).values_list('code', flat=True)
    )
    to_create = []
    for index, (code, name) in enumerate(DEFAULT_AMENITIES):
        if code in existing:
            continue
        to_create.append(
            Amenity(tenant=tenant, code=code, name=name, sort_order=index * 10)
        )
    if to_create:
        Amenity.objects.bulk_create(to_create)
