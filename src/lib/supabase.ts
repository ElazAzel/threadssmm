import { createClient } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabaseConfig } from './env'
import type { Database } from './database.types'

export const supabase = isSupabaseConfigured
  ? createClient<Database>(supabaseConfig.url, supabaseConfig.publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null
