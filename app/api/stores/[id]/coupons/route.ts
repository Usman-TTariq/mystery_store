import { supabaseServer } from '@/lib/supabase/server';
import { mapDbCoupon, sortCouponsByOrder } from '@/lib/utils/couponOrder';

async function resolveStore(
  supabase: ReturnType<typeof supabaseServer>,
  id: string
): Promise<{ row: Record<string, unknown>; uuid: string } | null> {
  const { data: byUuid } = await supabase
    .from('stores')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (byUuid) {
    return { row: byUuid as Record<string, unknown>, uuid: String(byUuid.id) };
  }

  const numericId = parseInt(id, 10);
  if (!Number.isNaN(numericId)) {
    const { data: bySerial } = await supabase
      .from('stores')
      .select('*')
      .eq('store_id', numericId)
      .maybeSingle();

    if (bySerial) {
      return { row: bySerial as Record<string, unknown>, uuid: String(bySerial.id) };
    }
  }

  const { data: bySlug } = await supabase
    .from('stores')
    .select('*')
    .eq('slug', id)
    .maybeSingle();

  if (bySlug) {
    return { row: bySlug as Record<string, unknown>, uuid: String(bySlug.id) };
  }

  return null;
}

async function fetchStoreCoupons(
  supabase: ReturnType<typeof supabaseServer>,
  storeUuid: string
) {
  const [byFk, byArray] = await Promise.all([
    supabase.from('coupons').select('*').eq('store_id', storeUuid),
    supabase.from('coupons').select('*').contains('store_ids', [storeUuid]),
  ]);

  if (byFk.error) throw byFk.error;
  if (byArray.error) throw byArray.error;

  const merged = new Map<string, ReturnType<typeof mapDbCoupon>>();
  for (const row of [...(byFk.data || []), ...(byArray.data || [])]) {
    merged.set(String(row.id), mapDbCoupon(row as Record<string, unknown>));
  }

  return Array.from(merged.values());
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = supabaseServer();
    const resolved = await resolveStore(supabase, id);

    if (!resolved) {
      return Response.json({ success: false, error: 'Store not found' }, { status: 404 });
    }

    const { row: store, uuid } = resolved;
    const coupons = await fetchStoreCoupons(supabase, uuid);
    const couponOrder = (store.coupon_order as string[] | null) || null;
    const sorted = sortCouponsByOrder(coupons, couponOrder);

    const active = coupons.filter((c) => c.isActive).length;

    return Response.json({
      success: true,
      store: {
        id: uuid,
        name: store.store_name,
        seoTitle: store.seoTitle || store.seo_title,
      },
      couponOrder,
      coupons: sorted,
      stats: {
        total: coupons.length,
        active,
        inactive: coupons.length - active,
      },
    });
  } catch (error) {
    console.error('GET store coupons error:', error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load store coupons',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const couponOrder = body?.couponOrder as string[] | undefined;

    if (!Array.isArray(couponOrder)) {
      return Response.json({ success: false, error: 'couponOrder array required' }, { status: 400 });
    }

    const supabase = supabaseServer();
    const resolved = await resolveStore(supabase, id);

    if (!resolved) {
      return Response.json({ success: false, error: 'Store not found' }, { status: 404 });
    }

    const { uuid } = resolved;
    const storeCoupons = await fetchStoreCoupons(supabase, uuid);
    const validIds = new Set(storeCoupons.map((c) => c.id));

    for (const couponId of couponOrder) {
      if (!validIds.has(couponId)) {
        return Response.json(
          { success: false, error: `Coupon ${couponId} does not belong to this store` },
          { status: 400 }
        );
      }
    }

    const { error } = await supabase
      .from('stores')
      .update({ coupon_order: couponOrder, updated_at: new Date().toISOString() })
      .eq('id', uuid);

    if (error) {
      return Response.json({ success: false, error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, couponOrder });
  } catch (error) {
    console.error('PUT store coupon order error:', error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save coupon order',
      },
      { status: 500 }
    );
  }
}
