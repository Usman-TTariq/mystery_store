import { supabaseServer } from '@/lib/supabase/server';

interface SupabaseCouponRow {
  id?: string | number;
  store_id: number | string;
  code?: string | null;
  categoryId?: string | null;
  currentUses?: number | null;
  description?: string | null;
  discount?: number | null;
  discountType?: string | null;
  expiryDate?: string | null;
  getCodeText?: string | null;
  getDealText?: string | null;
  isActive?: boolean | null;
  isLatest?: boolean | null;
  isPopular?: boolean | null;
  latestLayoutPosition?: number | null;
  layoutPosition?: number | null;
  logoUrl?: string | null;
  maxUses?: number | null;
  url?: string | null;
  couponType?: string | null;
  storeName?: string | null;
}

export async function GET() {
  try {
    const supabase = supabaseServer();

    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('isActive', true);

    if (error) {
      console.error('Supabase get coupons error:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message, coupons: [] }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const coupons = (data || []).map((row) => {
      const r = row as SupabaseCouponRow;

      return {
        id: r.id != null ? r.id.toString() : (r.code || undefined),
        code: r.code || '',
        storeName: r.storeName || undefined,
        // We don't have storeIds array here; just keep store_id for now if needed later
        storeIds: r.store_id ? [String(r.store_id)] : [],
        discount: r.discount ?? 0,
        discountType: (r.discountType as 'percentage' | 'fixed') || 'percentage',
        description: r.description || '',
        isActive: r.isActive ?? true,
        maxUses: r.maxUses ?? 0,
        currentUses: r.currentUses ?? 0,
        expiryDate: r.expiryDate || null,
        logoUrl: r.logoUrl || undefined,
        url: r.url || undefined,
        couponType: (r.couponType as 'code' | 'deal') || 'deal',
        getCodeText: r.getCodeText || undefined,
        getDealText: r.getDealText || undefined,
        isPopular: r.isPopular ?? false,
        layoutPosition: r.layoutPosition ?? null,
        isLatest: r.isLatest ?? false,
        latestLayoutPosition: r.latestLayoutPosition ?? null,
        categoryId: r.categoryId || null,
        createdAt: undefined,
        updatedAt: undefined,
      };
    });

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


