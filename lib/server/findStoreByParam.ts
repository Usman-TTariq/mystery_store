import { supabaseServer } from '@/lib/supabase/server';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function findStoreRowByParam(
  idParam: string
): Promise<Record<string, unknown> | null> {
  const supabase = supabaseServer();
  const param = idParam?.trim();
  if (!param) return null;

  if (UUID_RE.test(param)) {
    const { data } = await supabase.from('stores').select('*').eq('id', param).maybeSingle();
    if (data) return data as Record<string, unknown>;
  }

  if (/^\d+$/.test(param)) {
    const { data } = await supabase
      .from('stores')
      .select('*')
      .eq('store_id', Number(param))
      .maybeSingle();
    if (data) return data as Record<string, unknown>;
  }

  const { data: bySlug } = await supabase
    .from('stores')
    .select('*')
    .eq('slug', param)
    .maybeSingle();
  if (bySlug) return bySlug as Record<string, unknown>;

  const { data: bySlugCi } = await supabase
    .from('stores')
    .select('*')
    .ilike('slug', param)
    .maybeSingle();
  if (bySlugCi) return bySlugCi as Record<string, unknown>;

  const nameGuess = param.replace(/-/g, ' ');
  const { data: byName } = await supabase
    .from('stores')
    .select('*')
    .ilike('store_name', nameGuess)
    .maybeSingle();

  return byName ? (byName as Record<string, unknown>) : null;
}

export function mapStoreRowToResponse(row: Record<string, unknown>) {
  return {
    id: row.id != null ? String(row.id) : undefined,
    storeId:
      row.store_id != null
        ? typeof row.store_id === 'number'
          ? row.store_id
          : parseInt(String(row.store_id), 10)
        : undefined,
    name: String(row.store_name || row.name || ''),
    subStoreName: (row.subStoreName as string) || (row.sub_store_name as string) || undefined,
    slug: (row.slug as string) || undefined,
    description: String(row.description || ''),
    logoUrl: (row.store_logo_url as string) || (row.logo_url as string) || undefined,
    websiteUrl: (row.website_url as string) || undefined,
    trackingLink: (row.tracking_link as string) || undefined,
    country: (row.country as string) || undefined,
    status: (row.status as string) || undefined,
    seoTitle: (row.seoTitle as string) || (row.seo_title as string) || undefined,
    seoDescription:
      (row.seoDescription as string) || (row.seo_description as string) || undefined,
    isTrending: Boolean(row.isTrending ?? row.featured ?? false),
    layoutPosition: (row.layout_position as number | null) ?? null,
    categoryId: (row.category_id as string) || null,
    createdAt: row.created_at as string | undefined,
  };
}
