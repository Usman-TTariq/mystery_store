export interface OrderedCoupon {
  id?: string;
}

/** Sort coupons with most recently added/edited first. */
export function sortCouponsByRecentActivity<
  T extends { updatedAt?: string; createdAt?: string; id?: string }
>(coupons: T[]): T[] {
  return [...coupons].sort((a, b) => {
    const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
    if (bTime !== aTime) return bTime - aTime;
    return String(b.id || '').localeCompare(String(b.id || ''));
  });
}

/** Sort coupons by store's saved coupon_order; unknown coupons go to the end. */
export function sortCouponsByOrder<T extends OrderedCoupon>(
  coupons: T[],
  order: string[] | null | undefined
): T[] {
  if (!order?.length) return coupons;

  const rank = new Map(order.map((id, index) => [id, index]));

  return [...coupons].sort((a, b) => {
    const aRank = a.id != null ? rank.get(a.id) : undefined;
    const bRank = b.id != null ? rank.get(b.id) : undefined;

    if (aRank !== undefined && bRank !== undefined) return aRank - bRank;
    if (aRank !== undefined) return -1;
    if (bRank !== undefined) return 1;
    return 0;
  });
}

export function mapDbCoupon(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    code: (row.code as string) || '',
    title: (row.title as string) || (row.store_name as string) || (row.code as string) || '',
    storeName: (row.store_name as string) || undefined,
    storeIds: (row.store_ids as string[]) || [],
    description: (row.description as string) || '',
    isActive: row.status === 'active',
    expiryDate: (row.expiry_date as string) || null,
    couponType: ((row.coupon_type as string) || 'deal') as 'code' | 'deal',
    createdAt: row.created_at as string | undefined,
  };
}

export function couponBelongsToStore(
  coupon: { storeIds?: string[]; storeId?: string },
  storeId: string
): boolean {
  if (coupon.storeIds?.includes(storeId)) return true;
  if (coupon.storeId === storeId) return true;
  return false;
}
