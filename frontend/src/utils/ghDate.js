/** Local calendar date as YYYY-MM-DD (not UTC - fixes off-by-one in PKT etc.). */
export function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function toLocalDateISO(value) {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.slice(0, 10))) {
    return value.slice(0, 10);
  }
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function isSameDay(isoDate, targetISO) {
  if (!isoDate || !targetISO) return false;
  return String(isoDate).slice(0, 10) === targetISO;
}

export function matchesDateFilter(isoDate, filterMode, targetISO) {
  if (filterMode === 'all') return true;
  if (filterMode === 'today') return isSameDay(isoDate, todayISO());
  if (filterMode === 'date' && targetISO) return isSameDay(isoDate, targetISO);
  return true;
}

/** Stay occupies the selected calendar night (same rule as stay calendar). */
export function stayActiveOnDay(stay, dayISO) {
  const d = String(dayISO || '').slice(0, 10);
  const checkIn = String(stay?.check_in || '').slice(0, 10);
  const checkOut = String(stay?.check_out || '').slice(0, 10);
  if (!d || !checkIn || !checkOut) return false;
  return checkIn <= d && checkOut > d;
}
