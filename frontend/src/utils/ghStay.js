/** Stay can be cancelled before guest checks in. */
export const canCancelGhStay = (stay) => {
  if (!stay) return false;
  return !['CANCELLED', 'CHECKED_OUT', 'CHECKED_IN'].includes(stay.status);
};

/** Normalize API time ("14:00:00" or "14:00") for HTML time inputs. */
export const normalizeStayTime = (value, fallback = '') => {
  if (!value || typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return fallback;
  const hours = String(Math.min(23, Math.max(0, Number(match[1])))).padStart(2, '0');
  const minutes = String(Math.min(59, Math.max(0, Number(match[2])))).padStart(2, '0');
  return `${hours}:${minutes}`;
};

export const DEFAULT_GH_CHECK_IN_TIME = '18:00';
export const DEFAULT_GH_CHECK_OUT_TIME = '11:00';

export const ghStayTimesFromTenant = (tenant) => ({
  checkInTime: normalizeStayTime(tenant?.gh_default_check_in_time, DEFAULT_GH_CHECK_IN_TIME),
  checkOutTime: normalizeStayTime(tenant?.gh_default_check_out_time, DEFAULT_GH_CHECK_OUT_TIME),
});
