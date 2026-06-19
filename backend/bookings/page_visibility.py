"""Default Marriage Hall pages and tenant seeding helpers."""

DEFAULT_HALL_PAGES = (
    ('dashboard', 'Accountant / Dashboard', 10),
    ('bookings', 'Bookings', 20),
    ('calendar', 'Calendar', 30),
    ('customers', 'Customers', 40),
    ('payments', 'Payments', 50),
    ('expenses', 'Expenses', 60),
    ('inventory', 'Inventory', 70),
    ('decorations', 'Decoration Packages', 80),
    ('reports', 'Reports', 90),
    ('notifications', 'Notifications', 100),
    ('halls', 'Hall Management', 110),
    ('staff', 'Staff', 120),
    ('profile', 'Profile', 130),
    ('settings', 'Settings', 140),
)

HALL_PAGE_KEYS = frozenset(key for key, _label, _order in DEFAULT_HALL_PAGES)


def ensure_tenant_hall_pages(tenant):
    """Create missing Marriage Hall page rows for a tenant (all live by default)."""
    from .models import MarriageHallPageVisibility

    if not tenant:
        return
    for page_key, label, sort_order in DEFAULT_HALL_PAGES:
        MarriageHallPageVisibility.objects.get_or_create(
            tenant=tenant,
            page_key=page_key,
            defaults={
                'label': label,
                'sort_order': sort_order,
                'is_visible': True,
            },
        )
