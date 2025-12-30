import { createClient } from '@/lib/supabase/client'
import { extractOriginalCloudinaryUrl } from '@/lib/utils/cloudinary'

export interface Coupon {
  id?: string
  code: string
  storeName?: string
  storeIds?: string[]
  discount: number
  discountType: 'percentage' | 'fixed'
  description: string
  isActive: boolean
  maxUses: number
  currentUses: number
  expiryDate: string | null
  logoUrl?: string
  url?: string
  couponType?: 'code' | 'deal'
  getCodeText?: string
  getDealText?: string
  isPopular?: boolean
  layoutPosition?: number | null
  isLatest?: boolean
  latestLayoutPosition?: number | null
  categoryId?: string | null
  createdAt?: string
  updatedAt?: string
}

export async function createCoupon(coupon: Omit<Coupon, 'id'>, logoFile?: File) {
  const supabase = createClient()
  try {
    let logoUrl: string | undefined
    if (logoFile) {
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            const result = reader.result as string
            const base64 = result.split(',')[1]
            resolve(base64)
          }
          reader.onerror = reject
          reader.readAsDataURL(logoFile)
        })

        const uploadResponse = await fetch('/api/coupons/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: logoFile.name,
            contentType: logoFile.type || 'image/svg+xml',
            base64,
          }),
        })

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          if (uploadData.success && uploadData.logoUrl) {
            logoUrl = uploadData.logoUrl
            console.log('✅ Logo uploaded successfully:', logoUrl)
          }
        } else {
          console.warn('⚠️ Logo upload failed, continuing without logo')
        }
      } catch (serverError) {
        console.error('Error during server-side upload:', serverError)
        console.warn('Creating coupon without logo due to upload error')
      }
    }

    const couponData = {
      code: coupon.code,
      title: coupon.storeName || coupon.code || 'Coupon',  // Add title field (required by database)
      store_name: coupon.storeName,
      store_ids: coupon.storeIds || [],
      discount_value: coupon.discount,
      discount_type: coupon.discountType,
      description: coupon.description,
      status: coupon.isActive ? 'active' : 'inactive',
      max_uses: coupon.maxUses || 0,
      current_uses: coupon.currentUses || 0,
      expiry_date: coupon.expiryDate,
      logo_url: logoUrl,
      url: coupon.url,
      coupon_type: coupon.couponType,
      get_code_text: coupon.getCodeText,
      get_deal_text: coupon.getDealText,
      featured: coupon.isPopular || false,
      layout_position: coupon.layoutPosition,
      is_latest: coupon.isLatest || false,
      latest_layout_position: coupon.latestLayoutPosition,
      category_id: coupon.categoryId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }


    if (coupon.storeIds) {
      console.log('✅ Saving coupon with storeIds:', coupon.storeIds)
    }

    const { data, error } = await supabase
      .from('coupons')
      .insert(couponData)
      .select()
      .single()

    if (error) {
      console.error('Error creating coupon:', error)
      return { success: false, error }
    }

    return { success: true, id: data.id }
  } catch (error) {
    console.error('Error creating coupon:', error)
    return { success: false, error }
  }
}

export async function getCoupons(): Promise<Coupon[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error getting coupons:', error)
      return []
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      code: item.code,
      storeName: item.store_name,
      storeIds: item.store_ids || [],
      discount: item.discount_value,
      discountType: item.discount_type,
      description: item.description,
      isActive: item.status === 'active',
      maxUses: item.max_uses || 0,
      currentUses: item.current_uses || 0,
      expiryDate: item.expiry_date,
      logoUrl: item.logo_url,
      url: item.url,
      couponType: item.coupon_type,
      getCodeText: item.get_code_text,
      getDealText: item.get_deal_text,
      isPopular: item.featured,
      layoutPosition: item.layout_position,
      isLatest: item.is_latest,
      latestLayoutPosition: item.latest_layout_position,
      categoryId: item.category_id,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }))
  } catch (error) {
    console.error('Error getting coupons:', error)
    return []
  }
}

export async function getActiveCoupons(): Promise<Coupon[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error getting active coupons:', error)
      return []
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      code: item.code,
      storeName: item.store_name,
      storeIds: item.store_ids || [],
      discount: item.discount_value,
      discountType: item.discount_type,
      description: item.description,
      isActive: item.status === 'active',
      maxUses: item.max_uses || 0,
      currentUses: item.current_uses || 0,
      expiryDate: item.expiry_date,
      logoUrl: item.logo_url,
      url: item.url,
      couponType: item.coupon_type,
      getCodeText: item.get_code_text,
      getDealText: item.get_deal_text,
      isPopular: item.featured,
      layoutPosition: item.layout_position,
      isLatest: item.is_latest,
      latestLayoutPosition: item.latest_layout_position,
      categoryId: item.category_id,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }))
  } catch (error) {
    console.error('Error getting active coupons:', error)
    return []
  }
}

export async function getCouponById(id: string): Promise<Coupon | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      console.error('Error getting coupon:', error)
      return null
    }

    return {
      id: data.id,
      code: data.code,
      storeName: data.store_name,
      storeIds: data.store_ids || [],
      discount: data.discount_value,
      discountType: data.discount_type,
      description: data.description,
      isActive: data.status === 'active',
      maxUses: data.max_uses || 0,
      currentUses: data.current_uses || 0,
      expiryDate: data.expiry_date,
      logoUrl: data.logo_url,
      url: data.url,
      couponType: data.coupon_type,
      getCodeText: data.get_code_text,
      getDealText: data.get_deal_text,
      isPopular: data.featured,
      layoutPosition: data.layout_position,
      isLatest: data.is_latest,
      latestLayoutPosition: data.latest_layout_position,
      categoryId: data.category_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  } catch (error) {
    console.error('Error getting coupon:', error)
    return null
  }
}

export async function updateCoupon(id: string, updates: Partial<Coupon>) {
  try {
    const supabase = createClient()
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (updates.code) updateData.code = updates.code
    if (updates.storeName !== undefined) updateData.store_name = updates.storeName
    if (updates.storeIds !== undefined) updateData.store_ids = updates.storeIds
    if (updates.discount !== undefined) updateData.discount_value = updates.discount
    if (updates.discountType) updateData.discount_type = updates.discountType
    if (updates.description) updateData.description = updates.description
    if (updates.isActive !== undefined) updateData.status = updates.isActive ? 'active' : 'inactive'
    if (updates.maxUses !== undefined) updateData.max_uses = updates.maxUses
    if (updates.currentUses !== undefined) updateData.current_uses = updates.currentUses
    if (updates.expiryDate !== undefined) updateData.expiry_date = updates.expiryDate
    if (updates.logoUrl !== undefined) updateData.logo_url = updates.logoUrl
    if (updates.url !== undefined) updateData.url = updates.url
    if (updates.couponType) updateData.coupon_type = updates.couponType
    if (updates.getCodeText) updateData.get_code_text = updates.getCodeText
    if (updates.getDealText) updateData.get_deal_text = updates.getDealText
    if (updates.isPopular !== undefined) updateData.featured = updates.isPopular
    if (updates.layoutPosition !== undefined) updateData.layout_position = updates.layoutPosition
    if (updates.isLatest !== undefined) updateData.is_latest = updates.isLatest
    if (updates.latestLayoutPosition !== undefined) updateData.latest_layout_position = updates.latestLayoutPosition
    if (updates.categoryId !== undefined) updateData.category_id = updates.categoryId

    const { error } = await supabase
      .from('coupons')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('Error updating coupon:', error)
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating coupon:', error)
    return { success: false, error }
  }
}

export async function deleteCoupon(id: string) {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting coupon:', error)
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting coupon:', error)
    return { success: false, error }
  }
}

export async function getCouponsByCategoryId(categoryId: string): Promise<Coupon[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('category_id', categoryId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error getting coupons by category:', error)
      return []
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      code: item.code,
      storeName: item.store_name,
      storeIds: item.store_ids || [],
      discount: item.discount_value,
      discountType: item.discount_type,
      description: item.description,
      isActive: item.status === 'active',
      maxUses: item.max_uses || 0,
      currentUses: item.current_uses || 0,
      expiryDate: item.expiry_date,
      logoUrl: item.logo_url,
      url: item.url,
      couponType: item.coupon_type,
      getCodeText: item.get_code_text,
      getDealText: item.get_deal_text,
      isPopular: item.featured,
      layoutPosition: item.layout_position,
      isLatest: item.is_latest,
      latestLayoutPosition: item.latest_layout_position,
      categoryId: item.category_id,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }))
  } catch (error) {
    console.error('Error getting coupons by category:', error)
    return []
  }
}

export async function getCouponsByStoreName(storeName: string): Promise<Coupon[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('store_name', storeName)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error getting coupons by store name:', error)
      return []
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      code: item.code,
      storeName: item.store_name,
      storeIds: item.store_ids || [],
      discount: item.discount_value,
      discountType: item.discount_type,
      description: item.description,
      isActive: item.status === 'active',
      maxUses: item.max_uses || 0,
      currentUses: item.current_uses || 0,
      expiryDate: item.expiry_date,
      logoUrl: item.logo_url,
      url: item.url,
      couponType: item.coupon_type,
      getCodeText: item.get_code_text,
      getDealText: item.get_deal_text,
      isPopular: item.featured,
      layoutPosition: item.layout_position,
      isLatest: item.is_latest,
      latestLayoutPosition: item.latest_layout_position,
      categoryId: item.category_id,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }))
  } catch (error) {
    console.error('Error getting coupons by store name:', error)
    return []
  }
}

export async function getCouponsByStoreId(storeId: string): Promise<Coupon[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .contains('store_ids', [storeId])
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error getting coupons by store ID:', error)
      return []
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      code: item.code,
      storeName: item.store_name,
      storeIds: item.store_ids || [],
      discount: item.discount_value,
      discountType: item.discount_type,
      description: item.description,
      isActive: item.status === 'active',
      maxUses: item.max_uses || 0,
      currentUses: item.current_uses || 0,
      expiryDate: item.expiry_date,
      logoUrl: item.logo_url,
      url: item.url,
      couponType: item.coupon_type,
      getCodeText: item.get_code_text,
      getDealText: item.get_deal_text,
      isPopular: item.featured,
      layoutPosition: item.layout_position,
      isLatest: item.is_latest,
      latestLayoutPosition: item.latest_layout_position,
      categoryId: item.category_id,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }))
  } catch (error) {
    console.error('Error getting coupons by store ID:', error)
    return []
  }
}

export async function applyCoupon(code: string) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('status', 'active')
      .single()

    if (error || !data) {
      return { valid: false, message: 'Coupon not found' }
    }

    if (data.current_uses >= data.max_uses) {
      return { valid: false, message: 'Coupon usage limit reached' }
    }

    if (data.expiry_date) {
      const now = new Date()
      const expiryTime = new Date(data.expiry_date)
      if (now > expiryTime) {
        return { valid: false, message: 'Coupon has expired' }
      }
    }

    const coupon: Coupon = {
      id: data.id,
      code: data.code,
      storeName: data.store_name,
      storeIds: data.store_ids || [],
      discount: data.discount_value,
      discountType: data.discount_type,
      description: data.description,
      isActive: data.status === 'active',
      maxUses: data.max_uses || 0,
      currentUses: data.current_uses || 0,
      expiryDate: data.expiry_date,
      logoUrl: data.logo_url,
      url: data.url,
      couponType: data.coupon_type,
      getCodeText: data.get_code_text,
      getDealText: data.get_deal_text,
      isPopular: data.featured,
      layoutPosition: data.layout_position,
      isLatest: data.is_latest,
      latestLayoutPosition: data.latest_layout_position,
      categoryId: data.category_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }

    return { valid: true, coupon, id: data.id }
  } catch (error) {
    console.error('Error validating coupon:', error)
    return { valid: false, message: 'Error validating coupon' }
  }
}

export async function createCouponFromUrl(coupon: Omit<Coupon, 'id'>, logoUrl?: string) {
  try {
    let finalLogoUrl: string | undefined
    if (logoUrl && logoUrl.trim() !== '') {
      if (logoUrl.includes('res.cloudinary.com')) {
        if (logoUrl.includes('/image/image/upload/') || logoUrl.match(/res\.cloudinary\.com\/image\//)) {
          finalLogoUrl = extractOriginalCloudinaryUrl(logoUrl)
          console.log('🔧 Fixed malformed Cloudinary URL:', { original: logoUrl, fixed: finalLogoUrl })
        } else {
          finalLogoUrl = logoUrl
          console.log('✅ Using Cloudinary URL directly:', finalLogoUrl)
        }
      } else {
        finalLogoUrl = logoUrl
      }
    }

    const couponData = {
      code: coupon.code,
      title: coupon.storeName || coupon.code || 'Coupon',  // Add title field (required by database)
      store_name: coupon.storeName,
      store_ids: coupon.storeIds || [],
      discount_value: coupon.discount,
      discount_type: coupon.discountType,
      description: coupon.description,
      status: coupon.isActive ? 'active' : 'inactive',
      expiry_date: coupon.expiryDate,
      logo_url: finalLogoUrl,
      url: coupon.url,
      coupon_type: coupon.couponType,
      get_code_text: coupon.getCodeText,
      get_deal_text: coupon.getDealText,
      featured: coupon.isPopular || false,
      layout_position: coupon.layoutPosition,
      is_latest: coupon.isLatest || false,
      latest_layout_position: coupon.latestLayoutPosition,
      category_id: coupon.categoryId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }


    console.log('📤 Sending coupon data to Supabase:')
    console.log(couponData)

    const supabase = createClient()
    const { data, error } = await supabase
      .from('coupons')
      .insert(couponData)
      .select()
      .single()

    console.log('📥 Supabase response - Has data:', !!data, 'Has error:', !!error)
    if (data) console.log('Data:', data)
    if (error) {
      console.log('Error object:', error)
      console.log('Error properties:', Object.keys(error))
      console.log('Error message:', error.message)
      console.log('Error code:', error.code)
    }

    if (error) {
      console.error('❌ COUPON CREATION ERROR:')
      console.error('Message:', error.message)
      console.error('Code:', error.code)
      console.error('Details:', error.details)
      console.error('Hint:', error.hint)
      console.error('Full error:', error)
      return { success: false, error }
    }

    console.log('✅ Coupon created successfully with ID:', data.id)
    return { success: true, id: data.id }
  } catch (error) {
    console.error('💥 EXCEPTION during coupon creation:')
    console.error(error)
    return { success: false, error }
  }
}

export async function getPopularCoupons(): Promise<(Coupon | null)[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('featured', true)
      .eq('status', 'active')
      .not('layout_position', 'is', null)
      .order('layout_position', { ascending: true })
      .limit(8)

    if (error) {
      console.error('Error getting popular coupons:', error)
      return Array(8).fill(null)
    }

    const layoutSlots: (Coupon | null)[] = Array(8).fill(null)
      ; (data || []).forEach((item: any) => {
        if (item.layout_position >= 1 && item.layout_position <= 8) {
          layoutSlots[item.layout_position - 1] = {
            id: item.id,
            code: item.code,
            storeName: item.store_name,
            storeIds: item.store_ids || [],
            discount: item.discount_value,
            discountType: item.discount_type,
            description: item.description,
            isActive: item.status === 'active',
            maxUses: item.max_uses || 0,
            currentUses: item.current_uses || 0,
            expiryDate: item.expiry_date,
            logoUrl: item.logo_url,
            url: item.url,
            couponType: item.coupon_type,
            getCodeText: item.get_code_text,
            getDealText: item.get_deal_text,
            isPopular: item.featured,
            layoutPosition: item.layout_position,
            isLatest: item.is_latest,
            latestLayoutPosition: item.latest_layout_position,
            categoryId: item.category_id,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
          }
        }
      })

    return layoutSlots
  } catch (error) {
    console.error('Error getting popular coupons:', error)
    return Array(8).fill(null)
  }
}

export async function getLatestCoupons(): Promise<(Coupon | null)[]> {
  try {
    const supabase = createClient()

    // Check if Supabase is properly initialized
    if (!supabase) {
      console.error('Error: Supabase client not initialized')
      return Array(8).fill(null)
    }

    console.log('🔍 Fetching last 8 uploaded coupons by created_at date...')

    // Simply get the last 8 coupons by creation date, regardless of is_latest flag
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(8)

    if (error) {
      console.error('❌ Error getting latest coupons:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return Array(8).fill(null)
    }

    console.log('✅ Query successful! Found coupons:', data?.length || 0)
    console.log('📋 Coupon data:', data)

    // Map the coupons to fill the 8 slots
    const coupons = (data || []).map((item: any) => ({
      id: item.id,
      code: item.code,
      storeName: item.store_name,
      storeIds: item.store_ids || [],
      discount: item.discount_value,
      discountType: item.discount_type,
      description: item.description,
      isActive: item.status === 'active',
      maxUses: item.max_uses || 0,
      currentUses: item.current_uses || 0,
      expiryDate: item.expiry_date,
      logoUrl: item.logo_url,
      url: item.url,
      couponType: item.coupon_type,
      getCodeText: item.get_code_text,
      getDealText: item.get_deal_text,
      isPopular: item.featured,
      layoutPosition: item.layout_position,
      isLatest: item.is_latest,
      latestLayoutPosition: item.latest_layout_position,
      categoryId: item.category_id,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }))

    // Fill remaining slots with null if less than 8 coupons
    const layoutSlots: (Coupon | null)[] = [...coupons]
    while (layoutSlots.length < 8) {
      layoutSlots.push(null)
    }

    console.log('🎯 Final result:', coupons.length, 'coupons +', (8 - coupons.length), 'empty slots')
    return layoutSlots
  } catch (error) {
    console.error('❌ Error getting latest coupons:', error)
    return Array(8).fill(null)
  }
}
