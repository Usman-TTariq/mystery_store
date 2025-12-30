import { supabaseServer } from '@/lib/supabase/server';

interface SupabaseStoreRow {
  store_id?: string | number;
  store_name: string;
  description: string;
  store_logo_url?: string | null;
  isTrending?: boolean | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  slug?: string | null;
  subStoreName?: string | null;
  merchant_id?: string | null;
  network_id?: string | null;
  tracking_link?: string | null;
}

export async function GET() {
  try {
    const supabase = supabaseServer();

    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .order('store_id', { ascending: true });

    if (error) {
      console.error('Supabase get stores error:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message, stores: [] }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const rows = (data || []) as any[];

    const stores = rows.map((row) => ({
      id: row.store_id?.toString() || row.id?.toString(),
      storeId: row.store_id ? (typeof row.store_id === 'number' ? row.store_id : parseInt(row.store_id, 10)) : undefined,
      name: row.store_name || row.name || '',
      subStoreName: row.subStoreName || row.sub_store_name || undefined,
      slug: row.slug || undefined,
      description: row.description || '',
      logoUrl: row.store_logo_url || row.logo_url || undefined,
      seoTitle: row.seoTitle || row.seo_title || undefined,
      seoDescription: row.seoDescription || row.seo_description || undefined,
      isTrending: row.isTrending ?? row.featured ?? false,
      layoutPosition: row.layout_position || null,
      categoryId: row.category_id || null,
      merchantId: row.merchant_id || undefined,
      networkId: row.network_id || undefined,
      trackingLink: row.tracking_link || undefined,
      createdAt: row.created_at || undefined,
    }));

    return new Response(
      JSON.stringify({ success: true, stores }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error in Supabase stores GET route:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error fetching Supabase stores.',
        stores: [],
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}


