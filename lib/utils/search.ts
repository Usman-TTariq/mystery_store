import { Coupon } from '@/lib/services/couponService';
import { Store } from '@/lib/services/storeService';
import { Category } from '@/lib/services/categoryService';

export function normalizeSearchTerm(value: string): string {
  return value.toLowerCase().trim();
}

export function matchesSearchTerm(text: string | null | undefined, searchTerm: string): boolean {
  if (!text || !searchTerm) return false;
  return text.toLowerCase().includes(searchTerm);
}

export function filterStoresForSearch(stores: Store[], query: string, limit = 5): Store[] {
  const term = normalizeSearchTerm(query);
  if (!term) return [];

  return stores
    .filter(
      (store) =>
        matchesSearchTerm(store.name, term) ||
        matchesSearchTerm(store.description, term) ||
        matchesSearchTerm(store.slug, term) ||
        matchesSearchTerm(store.subStoreName, term)
    )
    .slice(0, limit);
}

export function filterCategoriesForSearch(categories: Category[], query: string, limit = 3): Category[] {
  const term = normalizeSearchTerm(query);
  if (!term) return [];

  return categories.filter((cat) => matchesSearchTerm(cat.name, term)).slice(0, limit);
}

export function filterCouponsForSearch(
  coupons: Coupon[],
  query: string,
  stores: Store[],
  limit = 6
): Coupon[] {
  const term = normalizeSearchTerm(query);
  if (!term) return [];

  const matchingStoreIds = new Set(
    stores
      .filter(
        (store) =>
          matchesSearchTerm(store.name, term) ||
          matchesSearchTerm(store.slug, term) ||
          matchesSearchTerm(store.subStoreName, term)
      )
      .map((store) => store.id)
      .filter((id): id is string => Boolean(id))
  );

  const matchingStoreNames = new Set(
    stores
      .filter((store) => matchingStoreIds.has(store.id || ''))
      .map((store) => store.name.toLowerCase())
  );

  return coupons
    .filter((coupon) => {
      if (coupon.isActive === false) return false;

      const directMatch =
        matchesSearchTerm(coupon.code, term) ||
        matchesSearchTerm(coupon.storeName, term) ||
        matchesSearchTerm(coupon.description, term);

      const linkedStoreMatch = coupon.storeIds?.some((id) => matchingStoreIds.has(id));
      const storeNameMatch =
        coupon.storeName && matchingStoreNames.has(coupon.storeName.toLowerCase());

      return directMatch || linkedStoreMatch || storeNameMatch;
    })
    .slice(0, limit);
}

export function getCouponLabel(coupon: Coupon): string {
  if (coupon.storeName?.trim()) return coupon.storeName.trim();
  if (coupon.code?.trim()) return coupon.code.trim();
  return 'Coupon';
}

export function getCouponSubtitle(coupon: Coupon): string {
  if (coupon.code?.trim() && coupon.storeName?.trim()) {
    return coupon.code.trim();
  }
  if (coupon.description?.trim()) {
    return coupon.description.trim();
  }
  return coupon.couponType === 'deal' ? 'Deal' : 'Special offer';
}
