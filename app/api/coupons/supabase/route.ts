import { supabaseServer } from '@/lib/supabase/server';

function mapDbRowToCoupon(row: Record<string, unknown>) {
  const storeIds = Array.isArray(row.store_ids)
    ? (row.store_ids as string[]).map(String)
    : row.store_id
      ? [String(row.store_id)]
      : [];

  return {
    id: row.id != null ? String(row.id) : undefined,
    code: (row.code as string) || '',
    storeName: (row.store_name as string) || undefined,
    storeIds,
    discount: Number(row.discount_value ?? row.discount ?? 0),
    discountType: ((row.discount_type as string) || 'percentage') as 'percentage' | 'fixed',
    description: (row.description as string) || '',
    isActive: row.status === 'active',
    maxUses: Number(row.max_uses ?? 0),
    currentUses: Number(row.current_uses ?? 0),
    expiryDate: (row.expiry_date as string) || null,
    logoUrl: (row.logo_url as string) || undefined,
    url: (row.url as string) || undefined,
    couponType: ((row.coupon_type as string) || 'code') as 'code' | 'deal',
    getCodeText: (row.get_code_text as string) || undefined,
    getDealText: (row.get_deal_text as string) || undefined,
    isPopular: Boolean(row.featured),
    layoutPosition: (row.layout_position as number | null) ?? null,
    isLatest: Boolean(row.is_latest),
    latestLayoutPosition: (row.latest_layout_position as number | null) ?? null,
    categoryId: (row.category_id as string) || null,
    createdAt: row.created_at as string | undefined,
    updatedAt: row.updated_at as string | undefined,
  };
}

export async function GET() {
  try {
    const supabase = supabaseServer();

    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase get coupons error:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message, coupons: [] }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const coupons = (data || []).map((row) =>
      mapDbRowToCoupon(row as Record<string, unknown>)
    );

    return new Response(
      JSON.stringify({ success: true, coupons }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error in Supabase coupons GET route:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error fetching Supabase coupons.',
        coupons: [],
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
