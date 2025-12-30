import { createClient } from '@/lib/supabase/client'

export interface NewsArticle {
  id?: string
  title: string
  description: string
  content?: string
  imageUrl: string
  articleUrl?: string
  date?: string
  layoutPosition?: number | null
  createdAt?: string
  updatedAt?: string
}

const supabase = createClient()

export async function createNewsFromUrl(
  title: string,
  articleUrl: string,
  imageUrl: string,
  description?: string,
  content?: string,
  layoutPosition?: number | null,
  date?: string
) {
  try {
    const { data, error } = await supabase
      .from('articles')
      .insert({
        title: title || '',
        excerpt: description || '',
        content: content || '',
        featured_image_url: imageUrl,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        published: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating news article:', error)
      return { success: false, error }
    }

    return { success: true, id: data.id }
  } catch (error) {
    console.error('Error creating news article from URL:', error)
    return { success: false, error }
  }
}

export async function getNews(): Promise<NewsArticle[]> {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error getting news:', error)
      return []
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      title: item.title,
      description: item.excerpt || '',
      content: item.content || '',
      imageUrl: item.featured_image_url || '',
      articleUrl: '',
      date: new Date(item.created_at).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      layoutPosition: null,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }))
  } catch (error) {
    console.error('Error getting news:', error)
    return []
  }
}

export async function getNewsById(id: string): Promise<NewsArticle | null> {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .eq('published', true)
      .single()

    if (error || !data) {
      console.error('Error getting news:', error)
      return null
    }

    return {
      id: data.id,
      title: data.title,
      description: data.excerpt || '',
      content: data.content || '',
      imageUrl: data.featured_image_url || '',
      articleUrl: '',
      date: new Date(data.created_at).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      layoutPosition: null,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  } catch (error) {
    console.error('Error getting news:', error)
    return null
  }
}

export async function getNewsWithLayout(): Promise<(NewsArticle | null)[]> {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(4)

    if (error) {
      console.error('Error getting news with layout:', error)
      return Array(4).fill(null)
    }

    const layoutSlots: (NewsArticle | null)[] = Array(4).fill(null)
    ;(data || []).forEach((item: any, index: number) => {
      if (index < 4) {
        layoutSlots[index] = {
          id: item.id,
          title: item.title,
          description: item.excerpt || '',
          content: item.content || '',
          imageUrl: item.featured_image_url || '',
          articleUrl: '',
          date: new Date(item.created_at).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
          layoutPosition: index + 1,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        }
      }
    })

    return layoutSlots
  } catch (error) {
    console.error('Error getting news with layout:', error)
    return Array(4).fill(null)
  }
}

export async function updateNews(id: string, updates: Partial<NewsArticle>) {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (updates.title) updateData.title = updates.title
    if (updates.description) updateData.excerpt = updates.description
    if (updates.content) updateData.content = updates.content
    if (updates.imageUrl) updateData.featured_image_url = updates.imageUrl

    const { error } = await supabase
      .from('articles')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('Error updating news:', error)
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating news:', error)
    return { success: false, error }
  }
}

export async function deleteNews(id: string) {
  try {
    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting news:', error)
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting news:', error)
    return { success: false, error }
  }
}
