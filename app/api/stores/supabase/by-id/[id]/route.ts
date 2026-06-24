import { supabaseServer } from '@/lib/supabase/server';
import { syncStoreCouponUrls } from '@/lib/server/syncStoreCouponUrls';
import { findStoreRowByParam, mapStoreRowToResponse } from '@/lib/server/findStoreByParam';

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
  tracking_link?: string | null;
  country?: string | null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await findStoreRowByParam(id ?? '');

    if (!data) {
      return new Response(
        JSON.stringify({ success: false, error: 'Store not found', store: null }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, store: mapStoreRowToResponse(data) }),
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

    const body = await req.json();

    const updates: Partial<SupabaseStoreRow> & { updated_at?: string } = {
      updated_at: new Date().toISOString(),
    };
    if (body.store_id !== undefined) updates.store_id = body.store_id;
    if (body.store_name !== undefined) updates.store_name = body.store_name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.store_logo_url !== undefined) updates.store_logo_url = body.store_logo_url;
    if (body.subStoreName !== undefined) updates.subStoreName = body.subStoreName;
    if (body.slug !== undefined) updates.slug = body.slug;
    if (body.seoTitle !== undefined) updates.seoTitle = body.seoTitle;
    if (body.seoDescription !== undefined) updates.seoDescription = body.seoDescription;
    if (body.isTrending !== undefined) updates.isTrending = body.isTrending;
    if (body.tracking_link !== undefined) updates.tracking_link = body.tracking_link;
    if (body.country !== undefined) updates.country = body.country;

    const fieldCount = Object.keys(updates).length;
    if (fieldCount <= 1) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No fields provided to update.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const existing = await findStoreRowByParam(idParam);
    if (!existing?.id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Store not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await supabase
      .from('stores')
      .update(updates)
      .eq('id', String(existing.id))
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

    let syncedCoupons = 0;
    if (body.tracking_link !== undefined) {
      try {
        const rowAfterUpdate = data as Record<string, unknown>;
        syncedCoupons = await syncStoreCouponUrls({
          storeUuid: rowAfterUpdate.id != null ? String(rowAfterUpdate.id) : undefined,
          storeName: String(rowAfterUpdate.store_name || rowAfterUpdate.name || ''),
          trackingLink: body.tracking_link,
        });
      } catch (syncError) {
        console.error('Failed to sync coupon URLs for store:', syncError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        store: mapStoreRowToResponse(data as Record<string, unknown>),
        syncedCoupons,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Unexpected error in PATCH store route:', err);

    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error updating store',
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
    const existing = await findStoreRowByParam(id ?? '');

    if (!existing?.id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Store not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { error } = await supabase.from('stores').delete().eq('id', String(existing.id));

    if (error) {
      console.error('Error deleting store:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Unexpected error in DELETE store route:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error deleting store',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
