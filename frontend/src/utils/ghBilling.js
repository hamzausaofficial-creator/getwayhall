import { formatRs } from './currency';

const PRICING_LABELS = {
  PER_NIGHT: '/ night',
  PER_STAY: '/ stay',
  PER_GUEST: '/ guest / night',
};

export function getIncludedGuests(room) {
  if (!room) return 1;
  const included = Number(room.included_guests);
  if (included > 0) return included;
  if (room.effective_included_guests) return Number(room.effective_included_guests);
  return Number(room.beds) || 1;
}

export function getServicePriceLabel(service) {
  const unit = PRICING_LABELS[service.pricing_unit] || '';
  return `${Number(service.price).toLocaleString()}${unit}`;
}

export function computeServiceAmount(service, nights, guestsCount) {
  const price = Number(service.price) || 0;
  const n = Math.max(Number(nights) || 0, 1);
  const g = Math.max(Number(guestsCount) || 1, 1);
  if (service.pricing_unit === 'PER_NIGHT') return price * n;
  if (service.pricing_unit === 'PER_GUEST') return price * g * n;
  return price;
}

/** Base rate covers included guests; extra guests pay extra_guest_fee_per_night. */
export function computeRoomGuestCharges(room, nights, guestsCount) {
  const n = Math.max(Number(nights) || 0, 1);
  const guests = Math.max(Number(guestsCount) || 1, 1);
  const nightly = Number(room?.price_per_night) || 0;
  const included = getIncludedGuests(room);
  const extraFee = Number(room?.extra_guest_fee_per_night) || 0;
  const extraGuests = Math.max(guests - included, 0);
  const roomBase = nightly * n;
  const extraGuestTotal = extraFee * extraGuests * n;
  const roomGuestTotal = roomBase + extraGuestTotal;
  return {
    nights: n,
    guests,
    included,
    extraGuests,
    nightly,
    extraFee,
    roomBase,
    extraGuestTotal,
    roomGuestTotal,
  };
}

export function computeStayBilling({ room, guestsCount, nights, services = [], selectedServiceIds = [] }) {
  if (!room || !nights || nights <= 0) return null;

  const {
    guests, included, extraGuests, nightly, extraFee, roomBase, extraGuestTotal, roomGuestTotal,
  } = computeRoomGuestCharges(room, nights, guestsCount);

  const selected = services.filter((s) => selectedServiceIds.includes(s.id));
  const serviceLines = selected.map((svc) => ({
    id: svc.id,
    label: svc.label,
    amount: computeServiceAmount(svc, nights, guests),
    pricing_unit: svc.pricing_unit,
  }));
  const serviceTotal = serviceLines.reduce((sum, line) => sum + line.amount, 0);
  const total = roomGuestTotal + serviceTotal;

  return {
    nights,
    guests,
    included,
    extraGuests,
    nightly,
    extraFee,
    roomBase,
    extraGuestTotal,
    roomGuestTotal,
    serviceLines,
    serviceTotal,
    total,
  };
}

export function formatReservationRoomLabel(room, nights, guestsCount) {
  if (!room) return '';
  const nightsN = Math.max(Number(nights) || 1, 1);
  const guests = Math.max(Number(guestsCount) || 1, 1);
  const included = getIncludedGuests(room);
  const extraGuests = Math.max(guests - included, 0);
  const nightly = formatRs(Number(room.price_per_night) || 0);
  const nightPart = `${nightsN} night${nightsN !== 1 ? 's' : ''}`;
  const guestPart = `${guests} guest${guests !== 1 ? 's' : ''}`;

  if (extraGuests > 0 && Number(room.extra_guest_fee_per_night) > 0) {
    const extraFee = formatRs(room.extra_guest_fee_per_night);
    return `Room ${room.room_number} · ${nightPart} · ${nightly}/night · ${guestPart} · ${extraGuests} extra @ ${extraFee}/night`;
  }

  return `Room ${room.room_number} · ${nightPart} · ${nightly}/night · ${guestPart}`;
}

export function formatRoomGuestChargeLabel(billing) {
  if (!billing) return '';
  const {
    nights, included, extraGuests, nightly, extraFee,
  } = billing;
  const inc = included ?? 1;
  const rate = formatRs(Number(nightly) || 0);
  const nightPart = `${nights} night${nights !== 1 ? 's' : ''}`;
  if (extraGuests > 0 && Number(extraFee) > 0) {
    const extraRate = formatRs(extraFee);
    return `Room · ${nightPart} · base ${inc} guest${inc !== 1 ? 's' : ''} @ ${rate}/night · ${extraGuests} extra @ ${extraRate}/night`;
  }
  return `Room · ${nightPart} · ${rate}/night · up to ${inc} guest${inc !== 1 ? 's' : ''} included`;
}
