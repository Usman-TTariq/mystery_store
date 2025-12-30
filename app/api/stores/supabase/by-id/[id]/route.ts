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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = supabaseServer();
    const { id: slug } = await params;
    const safeSlug = slug ?? '';

    // 1) Try exact match on slug
    let { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('slug', safeSlug)
      .limit(1)
      .maybeSingle();

    // 2) If not found, try case-insensitive slug match 
    if (!data) {
      const { data: ciData } = await supabase
        .from('stores')
        .select('*')
        .ilike('slug', safeSlug)
        .limit(1)
        .maybeSingle();
      data = ciData || null;
    }

    // 3) If still not found and slug is non-empty, try matching store_name
    //    (e.g., "MLK Store US" vs "MLK-Store-US")
    if (!data && safeSlug) {
      const nameGuess = safeSlug.replace(/-/g, ' ');
      const { data: nameData } = await supabase
        .from('stores')
        .select('*')
        .ilike('store_name', nameGuess)
        .limit(1)
        .maybeSingle();
      data = nameData || null;
    }

    if (error) {
      console.error('Supabase get store by slug error:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message, store: null }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!data) {
      return new Response(
        JSON.stringify({ success: false, error: 'Store not found', store: null }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const row = data as any;

    const store = {
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
      createdAt: row.created_at || undefined,
    };

    return new Response(
      JSON.stringify({ success: true, store }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error in Supabase store-by-id GET route:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error fetching Supabase store.',
        store: null,
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
    const idParam = id ?? '';
    // console.log("params awaited idParam: ", idParam);

    const body = await req.json();
    // console.log("body: ", body);

    // Allowed fields to update
    const updates: Partial<SupabaseStoreRow> = {};
    if (body.store_id !== undefined) updates.store_id = body.store_id;
    if (body.store_name !== undefined) updates.store_name = body.store_name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.store_logo_url !== undefined) updates.store_logo_url = body.store_logo_url;
    if (body.subStoreName !== undefined) updates.subStoreName = body.subStoreName;
    if (body.slug !== undefined) updates.slug = body.slug;
    if (body.seoTitle !== undefined) updates.seoTitle = body.seoTitle;
    if (body.seoDescription !== undefined) updates.seoDescription = body.seoDescription;
    if (body.isTrending !== undefined) updates.isTrending = body.isTrending;
    if (body.merchant_id !== undefined) updates.merchant_id = body.merchant_id;
    if (body.network_id !== undefined) updates.network_id = body.network_id;
    if (body.tracking_link !== undefined) updates.tracking_link = body.tracking_link;

    // Make sure something is being updated
    if (Object.keys(updates).length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No fields provided to update.'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Try finding the record first (using same flexible logic as GET) to get its primary key
    let existingData = null;

    // 1) If idParam is numeric, try matching store_id first
    if (/^\d+$/.test(idParam)) {
      const { data } = await supabase
        .from('stores')
        .select('store_id')
        .eq('store_id', Number(idParam))
        .limit(1)
        .maybeSingle();
      existingData = data;
    }

    // 2) If not found yet (or idParam wasn't numeric), try matching slug
    if (!existingData) {
      const { data } = await supabase
        .from('stores')
        .select('store_id')
        .eq('slug', idParam)
        .limit(1)
        .maybeSingle();
      existingData = data;
    }

    // 3) If not found, try case-insensitive slug match
    if (!existingData) {
      const { data } = await supabase
        .from('stores')
        .select('store_id')
        .ilike('slug', idParam)
        .limit(1)
        .maybeSingle();
      existingData = data;
    }

    // 4) If still not found, try matching store_name
    if (!existingData && idParam) {
      const nameGuess = idParam.replace(/-/g, ' ');
      const { data } = await supabase
        .from('stores')
        .select('store_id')
        .ilike('store_name', nameGuess)
        .limit(1)
        .maybeSingle();
      existingData = data;
    }

    if (!existingData) {
      return new Response(
        JSON.stringify({ success: false, error: 'Store not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Now update using the found store_id (most reliable)
    const { data, error } = await supabase
      .from('stores')
      .update(updates)
      .eq('store_id', existingData.store_id)
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('Error updating store:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!data) {
      return new Response(
        JSON.stringify({ success: false, error: 'Store not found (update failed)' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Reformat output the same as GET
    const row = data as any;
    const store = {
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
      createdAt: row.created_at || undefined,
    };

    return new Response(
      JSON.stringify({ success: true, store }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Unexpected error in PATCH store route:', err);

    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error updating store'
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
    const idParam = id ?? '';

    // Try finding the record first to ensure it exists and get correct ID
    let existingData = null;

    // 1) If idParam is numeric, try matching store_id first
    if (/^\d+$/.test(idParam)) {
      const { data } = await supabase
        .from('stores')
        .select('store_id')
        .eq('store_id', Number(idParam))
        .limit(1)
        .maybeSingle();
      existingData = data;
    }

    // 2) If not found yet, try matching slug
    if (!existingData) {
      const { data } = await supabase
        .from('stores')
        .select('store_id')
        .eq('slug', idParam)
        .limit(1)
        .maybeSingle();
      existingData = data;
    }

    // 3) Fallback: case-insensitive slug
    if (!existingData) {
      const { data } = await supabase
        .from('stores')
        .select('store_id')
        .ilike('slug', idParam)
        .limit(1)
        .maybeSingle();
      existingData = data;
    }

    // 4) Fallback: name
    if (!existingData && idParam) {
      const nameGuess = idParam.replace(/-/g, ' ');
      const { data } = await supabase
        .from('stores')
        .select('store_id')
        .ilike('store_name', nameGuess)
        .limit(1)
        .maybeSingle();
      existingData = data;
    }

    if (!existingData) {
      return new Response(
        JSON.stringify({ success: false, error: 'Store not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Delete the record using store_id
    const { error } = await supabase
      .from('stores')
      .delete()
      .eq('store_id', existingData.store_id);

    if (error) {
      console.error('Error deleting store:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Unexpected error in DELETE store route:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error deleting store'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
