from decimal import Decimal

# Up to 2 guests share one room rate with no extra guest fee.
# From 3 guests onward, each guest is charged the full nightly room rate.
COUPLE_GUEST_MAX = 2


def get_included_guests(room):
    """Guests covered at the flat couple rate (no per-guest multiplier)."""
    return COUPLE_GUEST_MAX


def compute_room_charges(room, nights, guests_count):
    """
    - 1–2 guests: flat room rate (price_per_night × nights), no extra fee.
    - 3+ guests: each guest pays the full nightly room rate (price_per_night × guests × nights).
    """
    nights = max(int(nights), 1)
    guests = max(int(guests_count or 1), 1)
    nightly = Decimal(str(room.price_per_night)) if room else Decimal('0')
    per_guest_all = guests > COUPLE_GUEST_MAX

    if per_guest_all:
        room_total = nightly * guests * nights
        room_base = room_total
        extra_guest_total = Decimal('0')
        extra_guests = guests
        included = COUPLE_GUEST_MAX
    else:
        room_base = nightly * nights
        extra_guest_total = Decimal('0')
        extra_guests = 0
        room_total = room_base
        included = COUPLE_GUEST_MAX

    return {
        'nights': nights,
        'guests': guests,
        'included_guests': included,
        'extra_guests': extra_guests,
        'per_guest_all': per_guest_all,
        'price_per_night': nightly,
        'extra_guest_fee_per_night': Decimal('0'),
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
        'per_guest_all': room_charges['per_guest_all'],
        'extra_guest_fee_per_night': 0.0,
        'extra_guest_total': room_charges['extra_guest_total'],
        'service_total': service_total,
        'total': room_charges['room_total'] + service_total,
    }
