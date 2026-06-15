export const demoMode = import.meta.env.VITE_DEMO_MODE === 'true'

export const supabaseConfig = {
  url: import.meta.env.VITE_SUPABASE_URL?.trim() ?? '',
  publishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? '',
}

export const isSupabaseConfigured = Boolean(supabaseConfig.url && supabaseConfig.publishableKey)
