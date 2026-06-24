import { supabaseServer } from '@/lib/supabase/server';
import { normalizeRedirectUrl } from '@/lib/utils/url';

export async function syncStoreCouponUrls(params: {
  storeUuid?: string | null;
  storeName?: string | null;
  trackingLink?: string | null;
}): Promise<number> {
  const supabase = supabaseServer();
  const url = normalizeRedirectUrl(params.trackingLink ?? null);
  const couponIds = new Set<string>();

  const storeUuid = params.storeUuid?.trim();
  const storeName = params.storeName?.trim();

  if (storeUuid) {
    const { data: byStoreId, error: storeIdError } = await supabase
      .from('coupons')
      .select('id')
      .eq('store_id', storeUuid);

    if (storeIdError) {
      console.error('syncStoreCouponUrls store_id query error:', storeIdError);
    } else {
      byStoreId?.forEach((row) => couponIds.add(String(row.id)));
    }

    const { data: byStoreIds, error: storeIdsError } = await supabase
      .from('coupons')
      .select('id')
      .contains('store_ids', [storeUuid]);

    if (storeIdsError) {
      console.error('syncStoreCouponUrls store_ids query error:', storeIdsError);
    } else {
      byStoreIds?.forEach((row) => couponIds.add(String(row.id)));
    }
  }

  if (storeName) {
    const { data: byName, error: nameError } = await supabase
      .from('coupons')
      .select('id')
      .ilike('store_name', storeName);

    if (nameError) {
      console.error('syncStoreCouponUrls store_name query error:', nameError);
    } else {
      byName?.forEach((row) => couponIds.add(String(row.id)));
    }
  }

  if (couponIds.size === 0) return 0;

  const { error } = await supabase
    .from('coupons')
    .update({
      url,
      updated_at: new Date().toISOString(),
    })
    .in('id', Array.from(couponIds));

  if (error) {
    console.error('syncStoreCouponUrls update error:', error);
    throw error;
  }

  return couponIds.size;
}
