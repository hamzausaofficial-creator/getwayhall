from django.utils import timezone


def page_maintenance_payload(row):
    """Resolve maintenance flags; auto-clear when maintenance_until has passed."""
    in_maintenance = bool(row.in_maintenance)
    until = getattr(row, 'maintenance_until', None)

    if in_maintenance and until and timezone.now() >= until:
        row.in_maintenance = False
        row.maintenance_until = None
        row.save(update_fields=['in_maintenance', 'maintenance_until'])
        in_maintenance = False
        until = None

    return {
        'in_maintenance': in_maintenance,
        'maintenance_until': until.isoformat() if until else None,
    }
