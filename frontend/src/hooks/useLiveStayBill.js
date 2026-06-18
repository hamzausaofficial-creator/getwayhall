import { useMemo } from 'react';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { computeStayBilling } from '../utils/ghBilling';

export function getBookingNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  try {
    const nights = differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn));
    return nights > 0 ? nights : 0;
  } catch {
    return 0;
  }
}

/**
 * Live stay bill while filling the booking form — updates on every field change.
 */
export default function useLiveStayBill({
  checkIn,
  checkOut,
  room,
  guestsCount,
  services = [],
  selectedAddonIds = [],
  advancePaid = 0,
}) {
  return useMemo(() => {
    const nights = getBookingNights(checkIn, checkOut);
    const guests = Math.max(Number(guestsCount) || 1, 1);
    const advance = Number(advancePaid) || 0;

    if (checkIn && checkOut && nights === 0) {
      return {
        status: 'error',
        error: 'Check-out must be after check-in.',
        nights: 0,
        guests,
      };
    }

    const base = {
      nights,
      guests,
      hasDates: Boolean(checkIn && checkOut && nights > 0),
      hasRoom: Boolean(room),
    };

    if (!base.hasDates) {
      return {
        ...base,
        status: 'partial',
        hint: 'Select check-in and check-out dates to start billing.',
      };
    }

    if (!room) {
      return {
        ...base,
        status: 'partial',
        hint: ` ${guests} guest${guests !== 1 ? 's' : ''} · ${nights} night${nights !== 1 ? 's' : ''} — select a room for the full bill.`,
      };
    }

    const billing = computeStayBilling({
      room,
      guestsCount: guests,
      nights,
      services,
      selectedServiceIds: selectedAddonIds,
    });

    if (!billing) {
      return { ...base, status: 'partial', hint: 'Select a room to calculate the bill.' };
    }

    const due = Math.max(0, billing.total - advance);

    return {
      ...base,
      ...billing,
      status: 'ready',
      ready: true,
      advance,
      due,
      advanceExceedsTotal: advance > billing.total,
    };
  }, [checkIn, checkOut, room, guestsCount, services, selectedAddonIds, advancePaid]);
}
