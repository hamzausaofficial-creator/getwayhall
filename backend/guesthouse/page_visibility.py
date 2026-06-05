"""Default Guest House pages and tenant seeding helpers."""

DEFAULT_GH_PAGES = (
    ('book', 'Book Stay', 10),
    ('stays', 'Stays', 20),
    ('calendar', 'Calendar', 30),
    ('rooms', 'Rooms', 40),
    ('customers', 'Customers', 50),
    ('payments', 'Payments', 60),
    ('expenses', 'Expenses', 70),
    ('staff', 'Staff', 80),
    ('reports', 'Reports', 90),
    ('notifications', 'Notifications', 100),
    ('dashboard', 'Dashboard', 110),
    ('profile', 'Profile', 120),
    ('settings', 'Settings', 130),
)


def ensure_tenant_gh_pages(tenant):
    """Create missing page visibility rows for a tenant (all visible by default)."""
    from .models import GuestHousePageVisibility

    if not tenant:
        return
    for page_key, label, sort_order in DEFAULT_GH_PAGES:
        GuestHousePageVisibility.objects.get_or_create(
            tenant=tenant,
            page_key=page_key,
            defaults={
                'label': label,
                'sort_order': sort_order,
                'is_visible': True,
            },
        )
