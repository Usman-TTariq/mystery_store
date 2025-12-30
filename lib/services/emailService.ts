import { createClient } from '@/lib/supabase/client'

export interface EmailSettings {
  id?: string
  email1: string
  email2: string
  email3: string
  updatedAt?: string
}

const supabase = createClient()
const emailSettingsDocId = 'main'

export async function getEmailSettings(): Promise<EmailSettings | null> {
  try {
    // Use system_pages table or create a separate settings table
    // For now, we'll use a simple approach with system_pages
    // Or you can create a settings table in Supabase
    const { data, error } = await supabase
      .from('system_pages')
      .select('*')
      .eq('page_type', 'email_settings')
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error getting email settings:', error)
    }

    if (data) {
      // Parse JSON content if stored as JSON
      try {
        const settings = JSON.parse(data.content)
        return {
          id: data.id,
          email1: settings.email1 || 'admin@coupachu.com',
          email2: settings.email2 || '',
          email3: settings.email3 || '',
          updatedAt: data.updated_at,
        }
      } catch {
        // If not JSON, return defaults
      }
    }

    // Return default if no settings exist
    return {
      id: emailSettingsDocId,
      email1: 'admin@coupachu.com',
      email2: '',
      email3: '',
    }
  } catch (error) {
    console.error('Error getting email settings:', error)
    return {
      id: emailSettingsDocId,
      email1: 'admin@coupachu.com',
      email2: '',
      email3: '',
    }
  }
}

export async function updateEmailSettings(
  email1: string,
  email2: string,
  email3: string
): Promise<{ success: boolean; error?: any }> {
  try {
    const settingsData = {
      email1: email1.trim(),
      email2: email2.trim(),
      email3: email3.trim(),
    }

    // Check if settings exist
    const { data: existing } = await supabase
      .from('system_pages')
      .select('id')
      .eq('page_type', 'email_settings')
      .single()

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('system_pages')
        .update({
          content: JSON.stringify(settingsData),
          updated_at: new Date().toISOString(),
        })
        .eq('page_type', 'email_settings')

      if (error) {
        console.error('Error updating email settings:', error)
        return { success: false, error }
      }
    } else {
      // Create new
      const { error } = await supabase
        .from('system_pages')
        .insert({
          page_type: 'email_settings',
          title: 'Email Settings',
          content: JSON.stringify(settingsData),
          updated_at: new Date().toISOString(),
        })

      if (error) {
        console.error('Error creating email settings:', error)
        return { success: false, error }
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating email settings:', error)
    return { success: false, error }
  }
}
