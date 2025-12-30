import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'

// Singleton pattern to avoid multiple instances
let supabaseInstance: SupabaseClient | null = null

export const supabaseBrowser = (): SupabaseClient => {
  // Return existing instance if available
  if (supabaseInstance) {
    return supabaseInstance
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase environment variables are missing!')
    console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? 'Set' : 'Missing')
    throw new Error('Supabase environment variables are not configured')
  }

  // Create and cache the instance
  supabaseInstance = createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'cache-control': 'no-cache, no-store, must-revalidate'
      }
    }
  })

  return supabaseInstance
}

// Alias for compatibility
export function createClient(): SupabaseClient {
  return supabaseBrowser()
}
