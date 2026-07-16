"""Suite/room mutual-exclusion availability helpers.

Rules:
- Booking a suite blocks that suite and all child rooms.
- Booking any child room blocks that room and its parent suite.
- Sibling rooms remain independently bookable.
"""

from .models import Room, StayBooking


def overlapping_stays_qs(tenant, check_in, check_out, exclude_stay=None):
    qs = StayBooking.objects.filter(
        tenant=tenant,
        check_in__lt=check_out,
        check_out__gt=check_in,
    ).exclude(status='CANCELLED')
    if exclude_stay:
        qs = qs.exclude(pk=exclude_stay)
    return qs


def blocked_unit_ids(tenant, check_in, check_out, exclude_stay=None):
    """
    Return set of Room PKs that cannot be sold for the date range.
    Includes directly booked units plus suite↔room cascade blocks.
    """
    booked_ids = set(
        overlapping_stays_qs(tenant, check_in, check_out, exclude_stay)
        .values_list('room_id', flat=True)
    )
    if not booked_ids:
        return set()

    units = list(
        Room.objects.filter(tenant=tenant, id__in=booked_ids).only(
            'id', 'parent_id', 'unit_kind', 'room_type',
        )
    )
    blocked = set(booked_ids)

    suite_ids = set()
    for unit in units:
        if unit.is_suite:
            suite_ids.add(unit.id)
        elif unit.parent_id:
            suite_ids.add(unit.parent_id)
            blocked.add(unit.parent_id)

    if suite_ids:
        child_ids = Room.objects.filter(
            tenant=tenant,
            parent_id__in=suite_ids,
        ).values_list('id', flat=True)
        blocked.update(child_ids)
        blocked.update(suite_ids)

    return blocked


def conflict_message(unit):
    label = 'Suite' if unit.is_suite else 'Room'
    return (
        f'{label} {unit.room_number} is unavailable for overlapping dates '
        f'(suite and its rooms cannot be booked at the same time).'
    )
