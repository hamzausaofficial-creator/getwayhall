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

/** Each guest pays the same nightly room rate as the primary guest. */
export function computeRoomGuestCharges(room, nights, guestsCount) {
  const n = Math.max(Number(nights) || 0, 1);
  const guests = Math.max(Number(guestsCount) || 1, 1);
  const nightly = Number(room?.price_per_night) || 0;
  const roomGuestTotal = nightly * guests * n;
  return { nights: n, guests, nightly, roomGuestTotal };
}

export function computeStayBilling({ room, guestsCount, nights, services = [], selectedServiceIds = [] }) {
  if (!room || !nights || nights <= 0) return null;

  const { guests, nightly, roomGuestTotal } = computeRoomGuestCharges(room, nights, guestsCount);

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
    nightly,
    roomGuestTotal,
    roomBase: roomGuestTotal,
    extraGuests: Math.max(guests - 1, 0),
    extraFee: nightly,
    extraGuestTotal: 0,
    included: 1,
    serviceLines,
    serviceTotal,
    total,
  };
}

export function formatRoomGuestChargeLabel(billing) {
  if (!billing) return '';
  const { guests, nightly, nights } = billing;
  return `Room (${guests} guest${guests !== 1 ? 's' : ''} × ${Number(nightly).toLocaleString()}/guest/night × ${nights} night${nights !== 1 ? 's' : ''})`;
}
