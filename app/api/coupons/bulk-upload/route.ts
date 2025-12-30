import { supabaseServer } from '@/lib/supabase/server';

interface SupabaseCouponRow {
  store_id: number;
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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rows = (body?.rows ?? []) as SupabaseCouponRow[];

    if (!rows.length) {
      return new Response(
        JSON.stringify({ success: false, error: 'No rows provided.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = supabaseServer();

    // Filter out columns that don't exist in the database schema
    // Remove categoryId and any other fields not in the actual schema
    const cleanedRows = rows.map(row => {
      const { categoryId, storeName, ...cleanRow } = row;
      // Only include fields that exist in the database
      return cleanRow;
    });

    // Insert data into Supabase 'coupons' table
    const { error, count } = await supabase
      .from('coupons')
      .insert(cleanedRows, { count: 'exact' });

    if (error) {
      console.error('Supabase bulk upload error:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, count }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Bulk upload handler error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during bulk upload.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

