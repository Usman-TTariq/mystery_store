import { createClient } from '@/lib/supabase/client'

export interface Store {
  id?: string
  storeId?: number  // Integer ID from database
  name: string
  subStoreName?: string
  slug?: string
  description: string
  logoUrl?: string
  websiteUrl?: string
  trackingLink?: string
  merchantId?: string
  networkId?: string
  country?: string
  status?: string
  voucherText?: string
  seoTitle?: string
  seoDescription?: string
  isTrending?: boolean
  layoutPosition?: number | null
  categoryId?: string | null
  createdAt?: string
}

export async function getStores(): Promise<Store[]> {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error getting stores:', error)
      return []
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      storeId: item.store_id,  // Integer ID from database
      name: item.store_name || item.name,  // Support both old and new schema
      subStoreName: item.sub_store_name,
      slug: item.slug,
      description: item.description || '',
      logoUrl: item.store_logo_url || item.logo_url,  // Support both old and new schema
      websiteUrl: item.website_url,
      trackingLink: item.tracking_link,
      merchantId: item.merchant_id,
      networkId: item.network_id,
      country: item.country,
      status: item.status,
      voucherText: item.voucher_text,
      seoTitle: item.seo_title || item.seoTitle,
      seoDescription: item.seo_description || item.seoDescription,
      isTrending: item.isTrending ?? item.featured,
      layoutPosition: item.layout_position,
      categoryId: item.category_id,
      createdAt: item.created_at,
    }))
  } catch (error) {
    console.error('Error getting stores:', error)
    return []
  }
}

export async function getTrendingStores(): Promise<(Store | null)[]> {
  try {
    const supabase = createClient()

    // Check if Supabase is properly initialized
    if (!supabase) {
      console.error('Error: Supabase client not initialized')
      return Array(8).fill(null)
    }

    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('isTrending', true)
      .not('layout_position', 'is', null)
      .order('layout_position', { ascending: true })
      .limit(8)

    if (error) {
      console.error('Error getting trending stores:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return Array(8).fill(null)
    }

    const layoutSlots: (Store | null)[] = Array(8).fill(null)
      ; (data || []).forEach((item: any) => {
        if (item.layout_position >= 1 && item.layout_position <= 8) {
          layoutSlots[item.layout_position - 1] = {
            id: item.id,
            storeId: item.store_id,
            name: item.store_name || item.name,
            subStoreName: item.sub_store_name,
            slug: item.slug,
            description: item.description || '',
            logoUrl: item.store_logo_url || item.logo_url,
            voucherText: item.voucher_text,
            seoTitle: item.seo_title || item.seoTitle,
            seoDescription: item.seo_description || item.seoDescription,
            isTrending: item.isTrending ?? item.featured,
            layoutPosition: item.layout_position,
            categoryId: item.category_id,
            createdAt: item.created_at,
          }
        }
      })

    return layoutSlots
  } catch (error) {
    console.error('Error getting trending stores:', error)
    return Array(8).fill(null)
  }
}

export async function createStore(store: Omit<Store, 'id'>) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('stores')
      .insert({
        store_name: store.name,
        subStoreName: store.subStoreName,
        slug: store.slug,
        description: store.description,
        store_logo_url: store.logoUrl,
        voucher_text: store.voucherText,
        seoTitle: store.seoTitle,
        seoDescription: store.seoDescription,
        isTrending: store.isTrending || false,
        layout_position: store.layoutPosition,
        category_id: store.categoryId,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating store:', error)
      return { success: false, error }
    }

    return { success: true, id: data.id }
  } catch (error) {
    console.error('Error creating store:', error)
    return { success: false, error }
  }
}

export async function getStoreById(id: string): Promise<Store | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      console.error('Error getting store:', error)
      return null
    }

    return {
      id: data.id,
      storeId: data.store_id,
      name: data.store_name || data.name,
      subStoreName: data.sub_store_name,
      slug: data.slug,
      description: data.description || '',
      logoUrl: data.store_logo_url || data.logo_url,
      voucherText: data.voucher_text,
      seoTitle: data.seo_title || data.seoTitle,
      seoDescription: data.seo_description || data.seoDescription,
      isTrending: data.isTrending ?? data.featured,
      layoutPosition: data.layout_position,
      categoryId: data.category_id,
      createdAt: data.created_at,
    }
  } catch (error) {
    console.error('Error getting store:', error)
    return null
  }
}

export async function getStoreBySlug(slug: string): Promise<Store | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error || !data) {
      console.error('Error getting store by slug:', error)
      return null
    }

    return {
      id: data.id,
      storeId: data.store_id,
      name: data.store_name || data.name,
      subStoreName: data.sub_store_name,
      slug: data.slug,
      description: data.description || '',
      logoUrl: data.store_logo_url || data.logo_url,
      voucherText: data.voucher_text,
      seoTitle: data.seo_title || data.seoTitle,
      seoDescription: data.seo_description || data.seoDescription,
      isTrending: data.isTrending ?? data.featured,
      layoutPosition: data.layout_position,
      categoryId: data.category_id,
      createdAt: data.created_at,
    }
  } catch (error) {
    console.error('Error getting store by slug:', error)
    return null
  }
}

export async function isSlugUnique(slug: string, excludeStoreId?: string): Promise<boolean> {
  try {
    const supabase = createClient()
    let query = supabase.from('stores').select('id').eq('slug', slug)

    if (excludeStoreId) {
      query = query.neq('id', excludeStoreId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error checking slug uniqueness:', error)
      return false
    }

    return (data || []).length === 0
  } catch (error) {
    console.error('Error checking slug uniqueness:', error)
    return false
  }
}

export async function updateStore(id: string, updates: Partial<Store>) {
  try {
    const supabase = createClient()
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (updates.name) updateData.store_name = updates.name
    if (updates.subStoreName !== undefined) updateData.subStoreName = updates.subStoreName
    if (updates.slug !== undefined) updateData.slug = updates.slug
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.logoUrl !== undefined) updateData.store_logo_url = updates.logoUrl
    if (updates.voucherText !== undefined) updateData.voucher_text = updates.voucherText
    if (updates.seoTitle !== undefined) updateData.seoTitle = updates.seoTitle
    if (updates.seoDescription !== undefined) updateData.seoDescription = updates.seoDescription
    if (updates.isTrending !== undefined) updateData.isTrending = updates.isTrending
    if (updates.layoutPosition !== undefined) updateData.layout_position = updates.layoutPosition
    if (updates.categoryId !== undefined) updateData.category_id = updates.categoryId
    if (updates.merchantId !== undefined) updateData.merchant_id = updates.merchantId
    if (updates.networkId !== undefined) updateData.network_id = updates.networkId
    if (updates.trackingLink !== undefined) updateData.tracking_link = updates.trackingLink

    const { error } = await supabase
      .from('stores')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('Error updating store:', error)
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating store:', error)
    return { success: false, error }
  }
}

export async function deleteStore(id: string) {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('stores')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting store:', error)
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting store:', error)
    return { success: false, error }
  }
}

export async function getStoresByCategoryId(categoryId: string): Promise<Store[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('category_id', categoryId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error getting stores by category:', error)
      return []
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      storeId: item.store_id,
      name: item.store_name || item.name,
      subStoreName: item.sub_store_name,
      slug: item.slug,
      description: item.description || '',
      logoUrl: item.store_logo_url || item.logo_url,
      voucherText: item.voucher_text,
      seoTitle: item.seo_title || item.seoTitle,
      seoDescription: item.seo_description || item.seoDescription,
      isTrending: item.isTrending ?? item.featured,
      layoutPosition: item.layout_position,
      categoryId: item.category_id,
      createdAt: item.created_at,
    }))
  } catch (error) {
    console.error('Error getting stores by category:', error)
    return []
  }
}
