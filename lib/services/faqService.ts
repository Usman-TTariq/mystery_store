import { createClient } from '@/lib/supabase/client'

export interface FAQ {
  id?: string
  question: string
  answer: string
  order?: number
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

const supabase = createClient()

export async function createFAQ(faq: Omit<FAQ, 'id'>) {
  try {
    const { data, error } = await supabase
      .from('faqs')
      .insert({
        question: faq.question,
        answer: faq.answer,
        order_index: faq.order || 0,
        category: faq.isActive ? 'active' : 'inactive',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating FAQ:', error)
      return { success: false, error }
    }

    return { success: true, id: data.id }
  } catch (error) {
    console.error('Error creating FAQ:', error)
    return { success: false, error }
  }
}

export async function getFAQs(): Promise<FAQ[]> {
  try {
    const { data, error } = await supabase
      .from('faqs')
      .select('*')
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error getting FAQs:', error)
      return []
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      question: item.question,
      answer: item.answer,
      order: item.order_index,
      isActive: true, // All returned FAQs are active
      createdAt: item.created_at,
      updatedAt: item.created_at,
    }))
  } catch (error) {
    console.error('Error getting FAQs:', error)
    return []
  }
}

export async function getActiveFAQs(): Promise<FAQ[]> {
  try {
    const { data, error } = await supabase
      .from('faqs')
      .select('*')
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error getting active FAQs:', error)
      return []
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      question: item.question,
      answer: item.answer,
      order: item.order_index,
      isActive: true,
      createdAt: item.created_at,
      updatedAt: item.created_at,
    }))
  } catch (error) {
    console.error('Error getting active FAQs:', error)
    return []
  }
}

export async function getFAQById(id: string): Promise<FAQ | null> {
  try {
    const { data, error } = await supabase
      .from('faqs')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      console.error('Error getting FAQ:', error)
      return null
    }

    return {
      id: data.id,
      question: data.question,
      answer: data.answer,
      order: data.order_index,
      isActive: true,
      createdAt: data.created_at,
      updatedAt: data.created_at,
    }
  } catch (error) {
    console.error('Error getting FAQ:', error)
    return null
  }
}

export async function updateFAQ(id: string, faq: Partial<Omit<FAQ, 'id'>>) {
  try {
    const updateData: any = {}

    if (faq.question !== undefined) updateData.question = faq.question
    if (faq.answer !== undefined) updateData.answer = faq.answer
    if (faq.order !== undefined) updateData.order_index = faq.order

    const { error } = await supabase
      .from('faqs')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('Error updating FAQ:', error)
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating FAQ:', error)
    return { success: false, error }
  }
}

export async function deleteFAQ(id: string) {
  try {
    const { error } = await supabase
      .from('faqs')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting FAQ:', error)
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting FAQ:', error)
    return { success: false, error }
  }
}
