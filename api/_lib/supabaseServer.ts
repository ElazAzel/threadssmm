import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createHash } from 'node:crypto'
import { getBearerToken, type ApiRequest } from './http.js'
import type { Database } from '../../src/lib/database.types.js'

export class RateLimitError extends Error {
  retryAfter: number

  constructor(retryAfter: number) {
    super('RATE_LIMITED')
    this.retryAfter = retryAfter
  }
}

export async function requireUser(request: ApiRequest) {
  const url = process.env.SUPABASE_URL
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY
  const secretKey = process.env.SUPABASE_SECRET_KEY
  if (!url || !publishableKey || !secretKey) throw new Error('SUPABASE_SERVER_NOT_CONFIGURED')

  const token = getBearerToken(request)
  if (!token) throw new Error('UNAUTHORIZED')

  const authClient = createClient<Database>(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await authClient.auth.getUser(token)
  if (error || !data.user) throw new Error('UNAUTHORIZED')

  const admin = createClient<Database>(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } })
  return { user: data.user, admin }
}

export async function enforceRateLimit(
  admin: SupabaseClient<Database>,
  bucket: string,
  identity: string,
  limit: number,
  windowSeconds: number,
) {
  const identityHash = createHash('sha256').update(identity).digest('hex')
  const { data, error } = await admin.rpc('check_api_rate_limit', {
    p_bucket: bucket,
    p_identity_hash: identityHash,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  })
  if (error) throw error
  const result = data?.[0]
  if (!result?.allowed) throw new RateLimitError(result?.retry_after_seconds ?? windowSeconds)
  return result
}
