import { supabaseServer } from '@/lib/supabase/server';

interface IncomingStoreRow {
  name: string;
  description: string;
  logo_url?: string | null;
  website_url?: string | null;
  tracking_link?: string | null;
  country?: string | null;
  status?: string | null;
  featured?: boolean | null;
  seo_title?: string | null;
  seo_description?: string | null;
  slug?: string | null;
  sub_store_name?: string | null;
  category_id?: string | null;
}

function mapStoreRow(row: IncomingStoreRow) {
  return {
    store_name: row.name,
    description: row.description,
    store_logo_url: row.logo_url ?? null,
    website_url: row.website_url ?? null,
    tracking_link: row.tracking_link ?? null,
    country: row.country ?? null,
    status: row.status ?? null,
    seoTitle: row.seo_title ?? null,
    seoDescription: row.seo_description ?? null,
    subStoreName: row.sub_store_name ?? null,
    isTrending: row.featured ?? false,
    slug: row.slug ?? null,
    category_id: row.category_id ?? null,
    updated_at: new Date().toISOString(),
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rows = (body?.rows ?? []) as IncomingStoreRow[];

    if (!Array.isArray(rows) || rows.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No rows provided for bulk upload.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = supabaseServer();
    const mappedRows = rows.map(mapStoreRow);

    const { error, count } = await supabase
      .from('stores')
      .upsert(mappedRows, {
        onConflict: 'slug',
        count: 'exact',
        ignoreDuplicates: false,
      });

    if (error) {
      console.error('Supabase bulk upsert error:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        inserted: count ?? mappedRows.length,
        uploaded: count ?? mappedRows.length,
        skipped: 0,
        errors: [],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error in bulk upload route:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during bulk upload.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
