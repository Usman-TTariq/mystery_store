import { supabaseServer } from '@/lib/supabase/server';

interface IncomingCouponRow {
  store_id?: number | string | null;
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

interface StoreLookup {
  id: string;
  storeId?: number;
  name: string;
}

function loadStoresFromDb(raw: Record<string, unknown>[]): StoreLookup[] {
  return raw.map((item) => ({
    id: String(item.id),
    storeId: item.store_id != null ? Number(item.store_id) : undefined,
    name: String(item.store_name || ''),
  }));
}

function resolveStore(
  row: IncomingCouponRow,
  storesList: StoreLookup[]
): { uuid: string; storeName: string } | null {
  if (row.store_id != null && row.store_id !== '') {
    const num =
      typeof row.store_id === 'number'
        ? row.store_id
        : parseInt(String(row.store_id), 10);
    if (!Number.isNaN(num)) {
      const match = storesList.find((s) => s.storeId === num);
      if (match) {
        return { uuid: match.id, storeName: match.name };
      }
    }
  }

  if (row.storeName?.trim()) {
    const needle = row.storeName.trim().toLowerCase();
    const match = storesList.find((s) => s.name?.toLowerCase() === needle);
    if (match) {
      return { uuid: match.id, storeName: match.name };
    }
  }

  return null;
}

function mapCouponRow(
  row: IncomingCouponRow,
  storeUuid: string,
  resolvedStoreName: string
) {
  const code = row.code?.trim() || '';
  const storeName = row.storeName?.trim() || resolvedStoreName;
  const title = row.title?.trim() || `${storeName} - ${code || 'Coupon'}`;

  return {
    code,
    title,
    store_name: storeName,
    store_ids: [storeUuid],
    store_id: storeUuid,
    discount_value: row.discount ?? 0,
    discount_type: row.discountType || 'percentage',
    description: row.description || '',
    status: row.isActive !== false ? 'active' : 'inactive',
    max_uses: row.maxUses ?? 0,
    current_uses: row.currentUses ?? 0,
    expiry_date: row.expiryDate || null,
    logo_url: row.logoUrl || null,
    url: row.url || null,
    coupon_type: row.couponType || 'code',
    get_code_text: row.getCodeText || null,
    get_deal_text: row.getDealText || null,
    featured: row.isPopular ?? false,
    layout_position: row.layoutPosition ?? null,
    is_latest: row.isLatest ?? false,
    latest_layout_position: row.latestLayoutPosition ?? null,
    category_id: row.categoryId || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rows = (body?.rows ?? []) as IncomingCouponRow[];

    if (!rows.length) {
      return new Response(
        JSON.stringify({ success: false, error: 'No rows provided.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = supabaseServer();

    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .select('id, store_id, store_name');

    if (storeError) {
      console.error('Failed to load stores for coupon bulk upload:', storeError);
      return new Response(
        JSON.stringify({ success: false, error: storeError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const storesList = loadStoresFromDb(storeData || []);
    const mappedRows: ReturnType<typeof mapCouponRow>[] = [];
    const errors: string[] = [];
    let skipped = 0;

    rows.forEach((row, index) => {
      const rowNum = index + 1;
      const resolved = resolveStore(row, storesList);

      if (!resolved) {
        skipped += 1;
        const idHint = row.store_id != null ? `store_id ${row.store_id}` : `Store Name "${row.storeName || ''}"`;
        errors.push(`Row ${rowNum}: store not found (${idHint})`);
        return;
      }

      mappedRows.push(mapCouponRow(row, resolved.uuid, resolved.storeName));
    });

    if (!mappedRows.length) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No valid coupon rows after store resolution.',
          uploaded: 0,
          skipped,
          errors,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { error: insertError, count } = await supabase
      .from('coupons')
      .insert(mappedRows, { count: 'exact' });

    if (insertError) {
      console.error('Supabase bulk upload error:', insertError);
      return new Response(
        JSON.stringify({ success: false, error: insertError.message, uploaded: 0, skipped, errors }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const uploaded = count ?? mappedRows.length;

    return new Response(
      JSON.stringify({
        success: true,
        count: uploaded,
        uploaded,
        skipped,
        errors,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Bulk upload handler error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during bulk upload.',
        uploaded: 0,
        skipped: 0,
        errors: [],
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
