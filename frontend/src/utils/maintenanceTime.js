const TZ = 'Asia/Karachi';

/** Parse Django ISO datetimes reliably across browsers. */
export function parseMaintenanceIso(iso) {
  if (!iso || typeof iso !== 'string') return null;
  const trimmed = iso.trim();
  if (!trimmed) return null;

  let date = new Date(trimmed);
  if (!Number.isNaN(date.getTime())) return date;

  // Fallback: treat as Asia/Karachi local when timezone is missing.
  const normalized = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T');
  date = new Date(`${normalized}+05:00`);
  if (!Number.isNaN(date.getTime())) return date;

  return null;
}

export function formatMaintenanceEnd(iso) {
  const date = parseMaintenanceIso(iso);
  if (!date) return null;
  return date.toLocaleString('en-PK', {
    timeZone: TZ,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatMaintenanceRemaining(iso) {
  const date = parseMaintenanceIso(iso);
  if (!date) return null;
  const diff = date.getTime() - Date.now();
  if (diff <= 0) return null;

  const totalSec = Math.floor(diff / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

export function isMaintenanceExpired(iso) {
  const date = parseMaintenanceIso(iso);
  if (!date) return false;
  return date.getTime() <= Date.now();
}
