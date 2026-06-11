/** Parse money; never negative for balance-due display */
export const parseAmount = (n) => Math.max(0, parseFloat(n || 0) || 0);

export const formatRs = (n) => `Rs ${parseAmount(n).toLocaleString()}`;

/** Amount due to collect: show "00" when nothing is due */
export const formatCollectDue = (n) => {
  const amount = parseAmount(n);
  if (amount <= 0) return '00';
  return `Rs ${Math.round(amount).toLocaleString()}`;
};

export const formatCollectDuePKR = (n) => {
  const amount = parseAmount(n);
  if (amount <= 0) return '00';
  return `PKR ${Math.round(amount).toLocaleString()}`;
};

export const hasCollectDue = (n) => parseAmount(n) > 0;

/** Balance to collect from a booking (cancelled = no collection) */
export const bookingCollectDue = (booking) => {
  if (!booking || booking.booking_status === 'CANCELLED') return 0;
  return parseAmount(booking.remaining_balance);
};
