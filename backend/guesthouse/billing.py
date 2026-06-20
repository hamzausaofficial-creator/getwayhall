from decimal import Decimal


def get_included_guests(room):
    """Guests covered by the base room rate before extra-guest fees apply."""
    if not room:
        return 1
    if room.included_guests and room.included_guests > 0:
        return int(room.included_guests)
    return int(room.beds or 1)


def compute_room_charges(room, nights, guests_count):
    """
    Base room rate covers up to `included_guests` people for the stay.
    Each guest beyond that pays `extra_guest_fee_per_night` per night.
    """
    nights = max(int(nights), 1)
    guests = max(int(guests_count or 1), 1)
    nightly = Decimal(str(room.price_per_night)) if room else Decimal('0')
    included = get_included_guests(room)
    extra_fee = Decimal(str(room.extra_guest_fee_per_night or 0))
    extra_guests = max(guests - included, 0)
    room_base = nightly * nights
    extra_guest_total = extra_fee * extra_guests * nights
    room_total = room_base + extra_guest_total
    return {
        'nights': nights,
        'guests': guests,
        'included_guests': included,
        'extra_guests': extra_guests,
        'price_per_night': nightly,
        'extra_guest_fee_per_night': extra_fee,
        'room_base': room_base,
        'extra_guest_total': extra_guest_total,
        'room_total': room_total,
        # Legacy alias used in a few API/UI spots
        'price_per_guest_per_night': nightly,
    }


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
    room_charges = compute_room_charges(room, nights, guests_count)
    service_total = sum(Decimal(str(c.get('amount', 0))) for c in service_charges)

    return {
        'nights': room_charges['nights'],
        'guests': room_charges['guests'],
        'price_per_guest_per_night': float(room_charges['price_per_night']),
        'room_guest_total': room_charges['room_total'],
        'room_base': room_charges['room_base'],
        'included_guests': room_charges['included_guests'],
        'extra_guests': room_charges['extra_guests'],
        'extra_guest_fee_per_night': float(room_charges['extra_guest_fee_per_night']),
        'extra_guest_total': room_charges['extra_guest_total'],
        'service_total': service_total,
        'total': room_charges['room_total'] + service_total,
    }
