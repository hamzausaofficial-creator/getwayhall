from decimal import Decimal


def get_included_guests(room):
    """Legacy helper — billing charges each guest at the room nightly rate."""
    if not room:
        return 1
    if room.included_guests and room.included_guests > 0:
        return room.included_guests
    return room.beds or 1


def compute_room_charges(room, nights, guests_count):
    """
    Each guest on the stay pays the same nightly room rate as the primary guest.
    Total room charge = price_per_night × guest_count × nights.
    """
    nights = max(int(nights), 1)
    guests = max(int(guests_count or 1), 1)
    nightly = Decimal(str(room.price_per_night)) if room else Decimal('0')
    room_total = nightly * guests * nights
    return {
        'nights': nights,
        'guests': guests,
        'price_per_guest_per_night': nightly,
        'room_total': room_total,
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
        'price_per_guest_per_night': float(room_charges['price_per_guest_per_night']),
        'room_guest_total': room_charges['room_total'],
        'room_base': room_charges['room_total'],
        'included_guests': 1,
        'extra_guests': max(room_charges['guests'] - 1, 0),
        'extra_guest_fee_per_night': float(room_charges['price_per_guest_per_night']),
        'extra_guest_total': Decimal('0'),
        'service_total': service_total,
        'total': room_charges['room_total'] + service_total,
    }
