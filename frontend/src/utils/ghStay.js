/** Stay can be cancelled before guest checks in. */
export const canCancelGhStay = (stay) => {
  if (!stay) return false;
  return !['CANCELLED', 'CHECKED_OUT', 'CHECKED_IN'].includes(stay.status);
};
