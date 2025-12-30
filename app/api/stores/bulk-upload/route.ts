import { supabaseServer } from '@/lib/supabase/server';

interface SupabaseStoreRow {
  name: string;
  description: string;
  logo_url?: string | null;
  website_url?: string | null;
  tracking_link?: string | null;
  merchant_id?: string | null;
  network_id?: string | null;
  country?: string | null;
  status?: string | null;
  featured?: boolean | null;
  seo_title?: string | null;
  seo_description?: string | null;
  slug?: string | null;
  sub_store_name?: string | null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rows = (body?.rows ?? []) as SupabaseStoreRow[];

    if (!Array.isArray(rows) || rows.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No rows provided for bulk upload.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = supabaseServer();

    // Use upsert to handle duplicates - update if slug exists, insert if new
    const { error, count } = await supabase
      .from('stores')
      .upsert(rows as SupabaseStoreRow[], {
        onConflict: 'slug',
        count: 'exact',
        ignoreDuplicates: false // Update existing records
      });

    if (error) {
      console.error('Supabase bulk upsert error:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, inserted: count ?? rows.length }),
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


