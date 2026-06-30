import { supabaseServer } from '@/lib/supabase/server';
import { resolveCouponExpiryDate } from '@/lib/utils/couponExpiry';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function autoCreateStore(
  supabase: ReturnType<typeof supabaseServer>,
  storeName: string,
  linkUrl?: string | null,
  logoUrl?: string | null,
  existingSlugs?: Set<string>
): Promise<{ id: string; slug: string } | null> {
  const baseSlug = slugify(storeName);
  if (!baseSlug) return null;

  const slugSet = existingSlugs ?? new Set<string>();
  let uniqueSlug = baseSlug;
  let suffix = 2;

  while (slugSet.has(uniqueSlug)) {
    uniqueSlug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const trimmedLink = linkUrl?.trim() || null;

  const { data, error } = await supabase
    .from('stores')
    .insert({
      store_name: storeName,
      slug: uniqueSlug,
      website_url: trimmedLink,
      tracking_link: trimmedLink,
      store_logo_url: logoUrl?.trim() || null,
      status: 'active',
      country: 'US',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error || !data?.id) {
    console.error('autoCreateStore failed:', error);
    return null;
  }

  slugSet.add(uniqueSlug);
  return { id: String(data.id), slug: uniqueSlug };
}

interface IncomingCouponRow {
  store_id?: number | string | null;
  storeUuid?: string | null;
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
  slug?: string;
  websiteUrl?: string;
  trackingLink?: string;
}

function loadStoresFromDb(raw: Record<string, unknown>[]): StoreLookup[] {
  return raw.map((item) => ({
    id: String(item.id),
    storeId: item.store_id != null ? Number(item.store_id) : undefined,
    name: String(item.store_name || ''),
    slug: item.slug ? String(item.slug) : undefined,
    websiteUrl: item.website_url ? String(item.website_url) : undefined,
    trackingLink: item.tracking_link ? String(item.tracking_link) : undefined,
  }));
}

function normalizeStoreName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ').replace(/[^\w\s.-]/g, '');
}

function hostnameFromUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  try {
    return new URL(url.trim()).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

function resolveStore(
  row: IncomingCouponRow,
  storesList: StoreLookup[]
): { uuid: string; storeName: string } | null {
  if (row.storeUuid?.trim()) {
    const uuid = row.storeUuid.trim();
    const byUuid = storesList.find((s) => s.id === uuid);
    if (byUuid) {
      return { uuid: byUuid.id, storeName: byUuid.name };
    }
  }

  const storeName = row.storeName?.trim();

  if (storeName) {
    const needle = normalizeStoreName(storeName);
    const exact = storesList.find((s) => normalizeStoreName(s.name) === needle);
    if (exact) {
      return { uuid: exact.id, storeName: exact.name };
    }

    const partial = storesList.find((s) => {
      const hay = normalizeStoreName(s.name);
      return hay.includes(needle) || needle.includes(hay);
    });
    if (partial) {
      return { uuid: partial.id, storeName: partial.name };
    }
  }

  if (row.store_id != null && row.store_id !== '') {
    const raw = String(row.store_id).trim();
    const uuidMatch = storesList.find((s) => s.id === raw);
    if (uuidMatch) {
      return { uuid: uuidMatch.id, storeName: uuidMatch.name };
    }

    const num = typeof row.store_id === 'number' ? row.store_id : parseInt(raw, 10);
    if (!Number.isNaN(num)) {
      const bySerial = storesList.find((s) => s.storeId === num);
      if (bySerial) {
        return { uuid: bySerial.id, storeName: bySerial.name };
      }
    }
  }

  const rowHost = hostnameFromUrl(row.url);
  if (rowHost) {
    const byUrl = storesList.find((s) => {
      const storeHost = hostnameFromUrl(s.websiteUrl);
      return storeHost === rowHost;
    });
    if (byUrl) {
      return { uuid: byUrl.id, storeName: byUrl.name };
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
    description: row.description?.trim() || '',
    status: row.isActive !== false ? 'active' : 'inactive',
    max_uses: row.maxUses ?? 0,
    current_uses: row.currentUses ?? 0,
    expiry_date: resolveCouponExpiryDate(row.expiryDate),
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
      .select('id, store_id, store_name, slug, website_url, tracking_link');

    if (storeError) {
      console.error('Failed to load stores for coupon bulk upload:', storeError);
      return new Response(
        JSON.stringify({ success: false, error: storeError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const storesList = loadStoresFromDb(storeData || []);
    const existingSlugs = new Set(
      storesList.map((s) => s.slug).filter((s): s is string => Boolean(s))
    );
    const autoCreatedInBatch = new Map<string, { uuid: string; storeName: string }>();
    const mappedRows: ReturnType<typeof mapCouponRow>[] = [];
    const errors: string[] = [];
    const storeNames: string[] = [];
    let skipped = 0;
    let storesCreated = 0;

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const rowNum = index + 1;

      const storeName = row.storeName?.trim() || '';
      const title = row.title?.trim() || '';
      const couponTypeRaw = row.couponType?.trim().toLowerCase() || '';
      const couponType = couponTypeRaw === 'deal' ? 'deal' : couponTypeRaw === 'code' ? 'code' : '';
      const code = row.code?.trim() || '';

      if (!storeName) {
        skipped += 1;
        errors.push(`Row ${rowNum}: Store Name is required`);
        continue;
      }
      if (!couponType) {
        skipped += 1;
        errors.push(`Row ${rowNum}: couponType must be "code" or "deal"`);
        continue;
      }
      if (!title) {
        skipped += 1;
        errors.push(`Row ${rowNum}: title is required`);
        continue;
      }
      if (couponType === 'code' && !code) {
        skipped += 1;
        errors.push(`Row ${rowNum}: code is required when couponType is "code"`);
        continue;
      }

      let resolved = resolveStore(row, storesList);

      if (!resolved) {
        const nameForCreate = row.storeName?.trim();
        if (nameForCreate) {
          const batchKey = normalizeStoreName(nameForCreate);
          const cached = autoCreatedInBatch.get(batchKey);

          if (cached) {
            resolved = { uuid: cached.uuid, storeName: cached.storeName };
          } else {
            const created = await autoCreateStore(
              supabase,
              nameForCreate,
              row.url,
              row.logoUrl,
              existingSlugs
            );

            if (created) {
              resolved = { uuid: created.id, storeName: nameForCreate };
              autoCreatedInBatch.set(batchKey, { uuid: created.id, storeName: nameForCreate });
              storesList.push({
                id: created.id,
                name: nameForCreate,
                slug: created.slug,
                websiteUrl: row.url?.trim() || undefined,
                trackingLink: row.url?.trim() || undefined,
              });
              storeNames.push(nameForCreate);
              storesCreated += 1;
            }
          }
        }
      }

      if (resolved && row.url?.trim()) {
        const storeRow = storesList.find((s) => s.id === resolved!.uuid);
        if (storeRow && !storeRow.trackingLink?.trim()) {
          const link = row.url.trim();
          const { error: linkError } = await supabase
            .from('stores')
            .update({
              tracking_link: link,
              website_url: storeRow.websiteUrl?.trim() || link,
              updated_at: new Date().toISOString(),
            })
            .eq('id', resolved.uuid);

          if (!linkError) {
            storeRow.trackingLink = link;
            if (!storeRow.websiteUrl?.trim()) storeRow.websiteUrl = link;
          }
        }
      }

      if (!resolved) {
        skipped += 1;
        const parts: string[] = [];
        if (row.storeName?.trim()) parts.push(`name "${row.storeName.trim()}"`);
        if (row.store_id != null && row.store_id !== '') parts.push(`store_id ${row.store_id}`);
        const idHint = parts.length ? parts.join(', ') : 'no store identifier';
        errors.push(`Row ${rowNum}: store not found (${idHint})`);
        continue;
      }

      mappedRows.push(mapCouponRow(row, resolved.uuid, resolved.storeName));
    }

    if (!mappedRows.length) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `No valid coupon rows. Fix required fields (Store Name, couponType, code, title) or check store names.`,
          uploaded: 0,
          skipped,
          errors,
          storeCount: storesList.length,
          storesCreated,
          storeNames,
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
        storesCreated,
        storeNames,
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
