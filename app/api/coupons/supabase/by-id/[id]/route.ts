import { supabaseServer } from '@/lib/supabase/server';
import { resolveCouponExpiryDate } from '@/lib/utils/couponExpiry';

interface CouponPayload {
  store_id?: string | null;
  storeIds?: string[];
  code?: string | null;
  title?: string | null;
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

function mapPayloadToDb(body: CouponPayload) {
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.code !== undefined) updates.code = body.code;
  if (body.storeName !== undefined) {
    updates.store_name = body.storeName;
    updates.title = body.title ?? body.storeName;
  }
  if (body.title !== undefined) updates.title = body.title;
  if (body.storeIds !== undefined) {
    updates.store_ids = body.storeIds;
    if (body.storeIds[0]) updates.store_id = body.storeIds[0];
  }
  if (body.store_id !== undefined) updates.store_id = body.store_id;
  if (body.categoryId !== undefined) updates.category_id = body.categoryId || null;
  if (body.currentUses !== undefined) updates.current_uses = body.currentUses;
  if (body.description !== undefined) updates.description = body.description;
  if (body.discount !== undefined) updates.discount_value = body.discount;
  if (body.discountType !== undefined) updates.discount_type = body.discountType;
  if (body.expiryDate !== undefined) {
    updates.expiry_date = resolveCouponExpiryDate(body.expiryDate);
  }
  if (body.getCodeText !== undefined) updates.get_code_text = body.getCodeText || null;
  if (body.getDealText !== undefined) updates.get_deal_text = body.getDealText || null;
  if (body.isActive !== undefined) updates.status = body.isActive ? 'active' : 'inactive';
  if (body.isLatest !== undefined) updates.is_latest = body.isLatest;
  if (body.isPopular !== undefined) updates.featured = body.isPopular;
  if (body.latestLayoutPosition !== undefined) {
    updates.latest_layout_position = body.latestLayoutPosition;
  }
  if (body.layoutPosition !== undefined) updates.layout_position = body.layoutPosition;
  if (body.logoUrl !== undefined) updates.logo_url = body.logoUrl || null;
  if (body.maxUses !== undefined) updates.max_uses = body.maxUses;
  if (body.url !== undefined) updates.url = body.url || null;
  if (body.couponType !== undefined) updates.coupon_type = body.couponType;

  return updates;
}

async function findCouponId(
  supabase: ReturnType<typeof supabaseServer>,
  rawId: string
): Promise<string | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawId);

  if (isUuid) {
    const { data } = await supabase
      .from('coupons')
      .select('id')
      .eq('id', rawId)
      .limit(1)
      .maybeSingle();
    if (data?.id) return String(data.id);
  }

  if (/^\d+$/.test(rawId)) {
    const { data } = await supabase
      .from('coupons')
      .select('id')
      .eq('id', Number(rawId))
      .limit(1)
      .maybeSingle();
    if (data?.id) return String(data.id);
  }

  const { data } = await supabase
    .from('coupons')
    .select('id')
    .eq('code', rawId)
    .limit(1)
    .maybeSingle();

  return data?.id ? String(data.id) : null;
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

    const couponId = await findCouponId(supabase, rawId);

    if (!couponId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Coupon not found', coupon: null }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('id', couponId)
      .maybeSingle();

    if (error || !data) {
      return new Response(
        JSON.stringify({
          success: false,
          error: error?.message || 'Coupon not found',
          coupon: null,
        }),
        { status: error ? 500 : 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, coupon: mapDbRowToCoupon(data as Record<string, unknown>) }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
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

    const body = (await req.json()) as CouponPayload;
    const updates = mapPayloadToDb(body);

    if (Object.keys(updates).length <= 1) {
      return new Response(
        JSON.stringify({ success: false, error: 'No fields provided to update.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const couponId = await findCouponId(supabase, rawId);

    if (!couponId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Coupon not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await supabase
      .from('coupons')
      .update(updates)
      .eq('id', couponId)
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

    return new Response(
      JSON.stringify({
        success: true,
        coupon: mapDbRowToCoupon(data as Record<string, unknown>),
      }),
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

    const couponId = await findCouponId(supabase, rawId);

    if (!couponId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Coupon not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { error } = await supabase.from('coupons').delete().eq('id', couponId);

    if (error) {
      console.error('Error deleting Supabase coupon:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
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
