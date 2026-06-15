import { createClient } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabaseConfig } from './env'

export const supabase = isSupabaseConfigured
  ? createClient(supabaseConfig.url, supabaseConfig.publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null
