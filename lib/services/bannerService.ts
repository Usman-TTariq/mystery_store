import { createClient } from '@/lib/supabase/client'

export interface Banner {
  id?: string
  title: string
  imageUrl: string
  layoutPosition?: number | null
  createdAt?: string
}

export async function createBanner(title: string, imageFile: File, layoutPosition?: number | null) {
  try {
    // Convert file to base64 and POST to server API for upload
    const toBase64 = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const dataUrl = reader.result as string
          const base64 = dataUrl.split(',')[1]
          resolve(base64)
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

    const base64 = await toBase64(imageFile)
    const res = await fetch('/api/banners/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        fileName: imageFile.name,
        contentType: imageFile.type,
        base64,
        collection: 'banners',
        layoutPosition,
      }),
    })

    const json = await res.json()

    if (!res.ok) {
      console.error('Server upload failed', { status: res.status, body: json })
      return { success: false, error: json }
    }

    return { success: true, id: json.id }
  } catch (error) {
    console.error('Error creating banner:', error)
    return { success: false, error }
  }
}

export async function getBanners(): Promise<Banner[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('active', true)
      .order('order_index', { ascending: true })

    if (error) {
      console.error('Error getting banners:', error)
      return []
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      title: item.title || '',
      imageUrl: item.image_url,
      layoutPosition: item.order_index,
      createdAt: item.created_at,
    }))
  } catch (error) {
    console.error('Error getting banners:', error)
    return []
  }
}

export async function getBannersWithLayout(): Promise<(Banner | null)[]> {
  try {
    const supabase = createClient()
    
    // Get all active banners with layout positions 1-4
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('active', true)
      .eq('position', 'home')
      .not('order_index', 'is', null)
      .gte('order_index', 1)
      .lte('order_index', 4)
      .order('order_index', { ascending: true })

    if (error) {
      console.error('Error getting banners with layout:', error)
      return Array(4).fill(null)
    }

    console.log('Banners fetched from database:', data)

    const layoutSlots: (Banner | null)[] = Array(4).fill(null)
    ;(data || []).forEach((item: any) => {
      if (item.order_index >= 1 && item.order_index <= 4) {
        const banner: Banner = {
          id: item.id,
          title: item.title || '',
          imageUrl: item.image_url,
          layoutPosition: item.order_index,
          createdAt: item.created_at,
        }
        console.log(`Setting banner at position ${item.order_index}:`, banner)
        layoutSlots[item.order_index - 1] = banner
      }
    })

    console.log('Final layout slots:', layoutSlots)
    return layoutSlots
  } catch (error) {
    console.error('Error getting banners with layout:', error)
    return Array(4).fill(null)
  }
}

export async function getBannerByLayoutPosition(position: number): Promise<Banner | null> {
  try {
    const supabase = createClient()
    
    if (!supabase) {
      console.error('Error: Supabase client not initialized')
      return null
    }

    console.log(`Fetching banner at position ${position}...`)

    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('active', true)
      .eq('order_index', position)
      .maybeSingle()

    if (error) {
      console.error(`Error getting banner at position ${position}:`, {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      
      // Check for RLS policy error
      if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy')) {
        console.error('RLS Policy Error: Please check Supabase RLS policies for banners table')
      }
      
      return null
    }

    if (!data) {
      console.log(`No banner found at position ${position}`)
      return null
    }

    const banner: Banner = {
      id: data.id,
      title: data.title || '',
      imageUrl: data.image_url,
      layoutPosition: data.order_index,
      createdAt: data.created_at,
    }

    console.log(`✅ Banner found at position ${position}:`, banner)
    return banner
  } catch (error) {
    console.error('Error getting banner by layout position:', error)
    return null
  }
}

export async function deleteBanner(id: string) {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('banners')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting banner:', error)
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting banner:', error)
    return { success: false, error }
  }
}

export async function createBannerFromUrl(title: string, imageUrl: string, layoutPosition?: number | null) {
  try {
    console.log('createBannerFromUrl called with:', { title, imageUrl, layoutPosition })
    
    const supabase = createClient()
    
    if (!supabase) {
      console.error('Error: Supabase client not initialized')
      return { success: false, error: 'Supabase client not initialized' }
    }

    console.log('Supabase client created, inserting banner...')

    const insertData = {
      title: title || '',
      image_url: imageUrl,
      position: 'home',
      active: true,
      order_index: layoutPosition || 0,
    }

    console.log('Insert data:', insertData)

    // Insert banner without timeout (Supabase should respond quickly)
    const { data, error } = await supabase
      .from('banners')
      .insert(insertData)
      .select()
      .single()

    console.log('Insert result:', { data, error })

    if (error) {
      console.error('Error creating banner from URL:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      
      // Check for RLS policy error
      if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy')) {
        return { 
          success: false, 
          error: 'Permission denied. Please check Supabase RLS policies. Make sure banners table allows INSERT operations.' 
        }
      }
      
      return { 
        success: false, 
        error: error.message || error.details || error.hint || 'Failed to create banner' 
      }
    }

    if (!data) {
      console.error('Error: No data returned from banner creation')
      return { success: false, error: 'No data returned from banner creation' }
    }

    console.log('Banner created successfully:', data.id)
    return { success: true, id: data.id, imageUrl }
  } catch (error) {
    console.error('Error creating banner from URL:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

export async function updateBanner(id: string, updates: Partial<Banner>) {
  try {
    const supabase = createClient()
    const updateData: any = {}

    if (updates.title !== undefined) updateData.title = updates.title
    if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl
    if (updates.layoutPosition !== undefined) updateData.order_index = updates.layoutPosition

    const { error } = await supabase
      .from('banners')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('Error updating banner:', error)
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating banner:', error)
    return { success: false, error }
  }
}
