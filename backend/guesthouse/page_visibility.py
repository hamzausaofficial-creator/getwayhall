"""Default Guest House pages, in-app modules, and tenant seeding helpers."""

DEFAULT_GH_PAGES = (
    ('book', 'Book Stay', 10),
    ('stays', 'Stays', 20),
    ('calendar', 'Calendar', 30),
    ('rooms', 'Rooms', 40),
    ('services', 'Add-on Services', 45),
    ('customers', 'Guest Directory', 50),
    ('records', 'All Records', 55),
    ('payments', 'Payments & Collections', 60),
    ('expenses', 'Expenses & Vouchers', 70),
    ('staff', 'Staff', 80),
    ('reports', 'Reports', 90),
    ('notifications', 'Notifications', 100),
    ('dashboard', 'Dashboard', 110),
    ('profile', 'Profile', 120),
    ('settings', 'Settings', 130),
)

# In-app feature blocks (not sidebar routes) — toggled from the same Django admin screen.
DEFAULT_GH_MODULES = (
    (
        'id_scanner',
        'ID Card Scanner (Guest details)',
        5,
    ),
)

GH_MODULE_KEYS = frozenset(key for key, _label, _order in DEFAULT_GH_MODULES)
GH_PAGE_KEYS = frozenset(key for key, _label, _order in DEFAULT_GH_PAGES)


def ensure_tenant_gh_pages(tenant):
    """Create missing page and module visibility rows for a tenant."""
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
    for page_key, label, sort_order in DEFAULT_GH_MODULES:
        GuestHousePageVisibility.objects.get_or_create(
            tenant=tenant,
            page_key=page_key,
            defaults={
                'label': label,
                'sort_order': sort_order,
                'is_visible': False,
            },
        )
