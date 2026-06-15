import { createClient } from '@supabase/supabase-js'
import { getBearerToken, type ApiRequest } from './http.js'

export async function requireUser(request: ApiRequest) {
  const url = process.env.SUPABASE_URL
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY
  const secretKey = process.env.SUPABASE_SECRET_KEY
  if (!url || !publishableKey || !secretKey) throw new Error('SUPABASE_SERVER_NOT_CONFIGURED')

  const token = getBearerToken(request)
  if (!token) throw new Error('UNAUTHORIZED')

  const authClient = createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await authClient.auth.getUser(token)
  if (error || !data.user) throw new Error('UNAUTHORIZED')

  const admin = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } })
  return { user: data.user, admin }
}
