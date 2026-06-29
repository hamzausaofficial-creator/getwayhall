import { formatRs } from './currency';

const PRICING_LABELS = {
  PER_NIGHT: '/ night',
  PER_STAY: '/ stay',
  PER_GUEST: '/ guest / night',
};

/** Up to 2 guests: flat room rate. 3+ guests: each pays full nightly room rate. */
export const COUPLE_GUEST_MAX = 2;

export function getIncludedGuests(_room) {
  return COUPLE_GUEST_MAX;
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

export function computeRoomGuestCharges(room, nights, guestsCount) {
  const n = Math.max(Number(nights) || 0, 1);
  const guests = Math.max(Number(guestsCount) || 1, 1);
  const nightly = Number(room?.price_per_night) || 0;
  const perGuestAll = guests > COUPLE_GUEST_MAX;

  if (perGuestAll) {
    const roomGuestTotal = nightly * guests * n;
    return {
      nights: n,
      guests,
      included: COUPLE_GUEST_MAX,
      extraGuests: guests,
      nightly,
      extraFee: 0,
      perGuestAll: true,
      roomBase: roomGuestTotal,
      extraGuestTotal: 0,
      roomGuestTotal,
    };
  }

  const roomBase = nightly * n;
  return {
    nights: n,
    guests,
    included: COUPLE_GUEST_MAX,
    extraGuests: 0,
    nightly,
    extraFee: 0,
    perGuestAll: false,
    roomBase,
    extraGuestTotal: 0,
    roomGuestTotal: roomBase,
  };
}

export function computeStayBilling({ room, guestsCount, nights, services = [], selectedServiceIds = [] }) {
  if (!room || !nights || nights <= 0) return null;

  const {
    guests, included, extraGuests, nightly, extraFee, perGuestAll,
    roomBase, extraGuestTotal, roomGuestTotal,
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
    perGuestAll,
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
  const nightly = formatRs(Number(room.price_per_night) || 0);
  const nightPart = `${nightsN} night${nightsN !== 1 ? 's' : ''}`;
  const guestPart = `${guests} guest${guests !== 1 ? 's' : ''}`;

  if (guests > COUPLE_GUEST_MAX) {
    return `Room ${room.room_number} · ${nightPart} · ${nightly}/night × ${guestPart}`;
  }

  return `Room ${room.room_number} · ${nightPart} · ${nightly}/night · ${guestPart} (no extra fee)`;
}

export function formatRoomGuestChargeLabel(billing) {
  if (!billing) return '';
  const { nights, guests, nightly, perGuestAll } = billing;
  const rate = formatRs(Number(nightly) || 0);
  const nightPart = `${nights} night${nights !== 1 ? 's' : ''}`;
  if (perGuestAll) {
    return `Room rate · ${rate}/night × ${guests} guest${guests !== 1 ? 's' : ''} × ${nightPart}`;
  }
  return `Room · ${nightPart} · ${rate}/night · up to ${COUPLE_GUEST_MAX} guests (no extra fee)`;
}
