from decimal import Decimal


def get_included_guests(room):
    if not room:
        return 1
    if room.included_guests and room.included_guests > 0:
        return room.included_guests
    return room.beds or 1


def compute_service_amount(service, nights, guests_count):
    price = Decimal(str(service.price))
    nights = max(int(nights), 1)
    guests = max(int(guests_count), 1)
    unit = service.pricing_unit
    if unit == 'PER_NIGHT':
        return price * nights
    if unit == 'PER_GUEST':
        return price * guests * nights
    return price


def compute_stay_billing(room, check_in, check_out, guests_count, service_charges=None):
    """Return billing breakdown dict for a stay."""
    service_charges = service_charges or []
    nights = max((check_out - check_in).days, 1) if check_in and check_out else 0
    included = get_included_guests(room)
    extra_guests = max(int(guests_count or 1) - included, 0)
    nightly = Decimal(str(room.price_per_night)) if room else Decimal('0')
    extra_fee = Decimal(str(room.extra_guest_fee_per_night)) if room else Decimal('0')

    room_base = nightly * nights
    extra_guest_total = extra_fee * extra_guests * nights
    service_total = sum(Decimal(str(c.get('amount', 0))) for c in service_charges)

    return {
        'nights': nights,
        'included_guests': included,
        'extra_guests': extra_guests,
        'extra_guest_fee_per_night': float(extra_fee),
        'room_base': room_base,
        'extra_guest_total': extra_guest_total,
        'service_total': service_total,
        'total': room_base + extra_guest_total + service_total,
    }
