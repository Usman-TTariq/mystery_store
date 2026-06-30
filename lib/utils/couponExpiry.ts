/** Default coupon expiry: 31 December of the current year (YYYY-MM-DD). */
export function getDefaultCouponExpiryDate(referenceDate = new Date()): string {
  const year = referenceDate.getFullYear();
  return `${year}-12-31`;
}

/** Use provided expiry when set; otherwise apply the default end-of-year date. */
export function resolveCouponExpiryDate(
  expiryDate: string | null | undefined,
  referenceDate = new Date()
): string {
  const trimmed = expiryDate?.trim();
  if (trimmed) return trimmed;
  return getDefaultCouponExpiryDate(referenceDate);
}

export function formatCouponExpiryDisplay(
  expiryDate: string | null | undefined,
  referenceDate = new Date()
): string {
  const resolved = resolveCouponExpiryDate(expiryDate, referenceDate);
  const date = new Date(resolved);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
