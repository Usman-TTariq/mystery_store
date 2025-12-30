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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = supabaseServer();
    const { id } = await params;
    const rawId = id ?? '';

    if (!rawId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Coupon id is required', coupon: null }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let data: any = null;
    let error: any = null;

    // 1) If id is numeric, try matching primary key id first
    if (/^\d+$/.test(rawId)) {
      const numericId = Number(rawId);
      const result = await supabase
        .from('coupons')
        .select('*')
        .eq('id', numericId)
        .limit(1)
        .maybeSingle();
      data = result.data;
      error = result.error;
    }

    // 2) If not found yet (or not numeric), try matching by code
    if (!data) {
      const result = await supabase
        .from('coupons')
        .select('*')
        .eq('code', rawId)
        .limit(1)
        .maybeSingle();
      data = result.data;
      error = error || result.error;
    }

    if (error && !data) {
      console.error('Supabase get coupon by id error:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message, coupon: null }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!data) {
      return new Response(
        JSON.stringify({ success: false, error: 'Coupon not found', coupon: null }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const r = data as SupabaseCouponRow;

    const coupon = {
      id: r.id != null ? r.id.toString() : (r.code || undefined),
      code: r.code || '',
      storeName: r.storeName || undefined,
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

    return new Response(
      JSON.stringify({ success: true, coupon }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error in Supabase coupon-by-id GET route:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error fetching Supabase coupon.',
        coupon: null,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = supabaseServer();
    const { id } = await params;
    const rawId = id ?? '';

    if (!rawId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Coupon id is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();

    const updates: Partial<SupabaseCouponRow> = {};

    if (body.store_id !== undefined) updates.store_id = body.store_id;
    if (body.code !== undefined) updates.code = body.code;
    if (body.categoryId !== undefined) updates.categoryId = body.categoryId;
    if (body.currentUses !== undefined) updates.currentUses = body.currentUses;
    if (body.description !== undefined) updates.description = body.description;
    if (body.discount !== undefined) updates.discount = body.discount;
    if (body.discountType !== undefined) updates.discountType = body.discountType;
    if (body.expiryDate !== undefined) updates.expiryDate = body.expiryDate;
    if (body.getCodeText !== undefined) updates.getCodeText = body.getCodeText;
    if (body.getDealText !== undefined) updates.getDealText = body.getDealText;
    if (body.isActive !== undefined) updates.isActive = body.isActive;
    if (body.isLatest !== undefined) updates.isLatest = body.isLatest;
    if (body.isPopular !== undefined) updates.isPopular = body.isPopular;
    if (body.latestLayoutPosition !== undefined) updates.latestLayoutPosition = body.latestLayoutPosition;
    if (body.layoutPosition !== undefined) updates.layoutPosition = body.layoutPosition;
    if (body.logoUrl !== undefined) updates.logoUrl = body.logoUrl;
    if (body.maxUses !== undefined) updates.maxUses = body.maxUses;
    if (body.url !== undefined) updates.url = body.url;
    if (body.couponType !== undefined) updates.couponType = body.couponType;
    if (body.storeName !== undefined) updates.storeName = body.storeName;

    if (Object.keys(updates).length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No fields provided to update.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Find the record first (by id or by code)
    let existingData: SupabaseCouponRow | null = null;

    if (/^\d+$/.test(rawId)) {
      const numericId = Number(rawId);
      const result = await supabase
        .from('coupons')
        .select('id')
        .eq('id', numericId)
        .limit(1)
        .maybeSingle();
      existingData = (result.data as SupabaseCouponRow) || null;
    }

    if (!existingData) {
      const result = await supabase
        .from('coupons')
        .select('id')
        .eq('code', rawId)
        .limit(1)
        .maybeSingle();
      existingData = (result.data as SupabaseCouponRow) || null;
    }

    if (!existingData || existingData.id == null) {
      return new Response(
        JSON.stringify({ success: false, error: 'Coupon not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await supabase
      .from('coupons')
      .update(updates)
      .eq('id', existingData.id)
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('Error updating Supabase coupon:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!data) {
      return new Response(
        JSON.stringify({ success: false, error: 'Coupon not found (update failed)' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const r = data as SupabaseCouponRow;

    const coupon = {
      id: r.id != null ? r.id.toString() : (r.code || undefined),
      code: r.code || '',
      storeName: r.storeName || undefined,
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

    return new Response(
      JSON.stringify({ success: true, coupon }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error in Supabase coupon PATCH route:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error updating Supabase coupon.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = supabaseServer();
    const { id } = await params;
    const rawId = id ?? '';

    if (!rawId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Coupon id is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Find the record first (by id or by code)
    let existingData: SupabaseCouponRow | null = null;

    if (/^\d+$/.test(rawId)) {
      const numericId = Number(rawId);
      const result = await supabase
        .from('coupons')
        .select('id')
        .eq('id', numericId)
        .limit(1)
        .maybeSingle();
      existingData = (result.data as SupabaseCouponRow) || null;
    }

    if (!existingData) {
      const result = await supabase
        .from('coupons')
        .select('id')
        .eq('code', rawId)
        .limit(1)
        .maybeSingle();
      existingData = (result.data as SupabaseCouponRow) || null;
    }

    if (!existingData || existingData.id == null) {
      return new Response(
        JSON.stringify({ success: false, error: 'Coupon not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', existingData.id);

    if (error) {
      console.error('Error deleting Supabase coupon:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error in Supabase coupon DELETE route:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error deleting Supabase coupon.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}


