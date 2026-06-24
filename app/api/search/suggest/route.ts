import { supabaseServer } from '@/lib/supabase/server';
import {
  filterCategoriesForSearch,
  filterCouponsForSearch,
  filterStoresForSearch,
} from '@/lib/utils/search';
import { Coupon } from '@/lib/services/couponService';
import { Store } from '@/lib/services/storeService';
import { Category } from '@/lib/services/categoryService';

function mapStore(row: Record<string, unknown>): Store {
  return {
    id: row.id != null ? String(row.id) : undefined,
    storeId: row.store_id != null ? Number(row.store_id) : undefined,
    name: String(row.store_name || row.name || ''),
    subStoreName: (row.sub_store_name as string) || undefined,
    slug: (row.slug as string) || undefined,
    description: String(row.description || ''),
    logoUrl: (row.store_logo_url as string) || (row.logo_url as string) || undefined,
    websiteUrl: (row.website_url as string) || undefined,
    trackingLink: (row.tracking_link as string) || undefined,
    country: (row.country as string) || undefined,
    status: (row.status as string) || undefined,
    categoryId: (row.category_id as string) || null,
    createdAt: row.created_at as string | undefined,
  };
}

function mapCoupon(row: Record<string, unknown>): Coupon {
  return {
    id: row.id != null ? String(row.id) : undefined,
    code: String(row.code || ''),
    storeName: (row.store_name as string) || undefined,
    storeIds: Array.isArray(row.store_ids) ? (row.store_ids as string[]).map(String) : [],
    discount: Number(row.discount_value ?? 0),
    discountType: ((row.discount_type as string) || 'percentage') as 'percentage' | 'fixed',
    description: String(row.description || ''),
    isActive: row.status === 'active',
    maxUses: Number(row.max_uses ?? 0),
    currentUses: Number(row.current_uses ?? 0),
    expiryDate: (row.expiry_date as string) || null,
    logoUrl: (row.logo_url as string) || undefined,
    url: (row.url as string) || undefined,
    couponType: ((row.coupon_type as string) || 'code') as 'code' | 'deal',
    getCodeText: (row.get_code_text as string) || undefined,
    getDealText: (row.get_deal_text as string) || undefined,
    isPopular: Boolean(row.featured),
    layoutPosition: (row.layout_position as number | null) ?? null,
    isLatest: Boolean(row.is_latest),
    latestLayoutPosition: (row.latest_layout_position as number | null) ?? null,
    categoryId: (row.category_id as string) || null,
    createdAt: row.created_at as string | undefined,
    updatedAt: row.updated_at as string | undefined,
  };
}

function mapCategory(row: Record<string, unknown>): Category {
  return {
    id: String(row.id),
    name: String(row.name || ''),
    slug: String(row.slug || ''),
    logoUrl: (row.icon_url as string) || undefined,
    backgroundColor: (row.background_color as string) || undefined,
    createdAt: row.created_at as string | undefined,
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim() || '';

    if (!query) {
      return Response.json({
        success: true,
        results: { stores: [], coupons: [], categories: [] },
      });
    }

    const supabase = supabaseServer();
    const pattern = `%${query}%`;

    const [storesRes, couponsRes, categoriesRes] = await Promise.all([
      supabase
        .from('stores')
        .select('*')
        .or(`store_name.ilike.${pattern},slug.ilike.${pattern},description.ilike.${pattern}`)
        .limit(20),
      supabase
        .from('coupons')
        .select('*')
        .eq('status', 'active')
        .or(`store_name.ilike.${pattern},code.ilike.${pattern},description.ilike.${pattern}`)
        .limit(30),
      supabase
        .from('categories')
        .select('*')
        .ilike('name', pattern)
        .limit(10),
    ]);

    if (storesRes.error) {
      console.error('Search suggest stores error:', storesRes.error);
    }
    if (couponsRes.error) {
      console.error('Search suggest coupons error:', couponsRes.error);
    }
    if (categoriesRes.error) {
      console.error('Search suggest categories error:', categoriesRes.error);
    }

    const stores = (storesRes.data || []).map((row) => mapStore(row as Record<string, unknown>));
    const coupons = (couponsRes.data || []).map((row) => mapCoupon(row as Record<string, unknown>));
    const categories = (categoriesRes.data || []).map((row) => mapCategory(row as Record<string, unknown>));

    const results = {
      stores: filterStoresForSearch(stores, query, 5),
      categories: filterCategoriesForSearch(categories, query, 3),
      coupons: filterCouponsForSearch(coupons, query, stores, 6),
    };

    return Response.json(
      { success: true, results },
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    console.error('Search suggest API error:', error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed',
        results: { stores: [], coupons: [], categories: [] },
      },
      { status: 500 }
    );
  }
}
