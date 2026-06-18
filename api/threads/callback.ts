import { createClient } from '@supabase/supabase-js'
import type { ApiRequest, ApiResponse } from '../_lib/http.js'
import { encryptToken, verifyOAuthState } from '../_lib/threads.js'
import type { Database } from '../../src/lib/database.types.js'

function queryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  const redirectUri = process.env.THREADS_REDIRECT_URI
  const appId = process.env.THREADS_APP_ID
  const appSecret = process.env.THREADS_APP_SECRET
  const supabaseUrl = process.env.SUPABASE_URL
  const secretKey = process.env.SUPABASE_SECRET_KEY
  const appOrigin = redirectUri ? new URL(redirectUri).origin : 'https://threadssmm.vercel.app'
  const fail = (message: string) => response.redirect(302, `${appOrigin}/app/accounts?threads_error=${encodeURIComponent(message)}`)
  if (!redirectUri || !appId || !appSecret || !supabaseUrl || !secretKey) return fail('Интеграция не настроена')

  try {
    const code = queryValue(request.query?.code)
    const stateValue = queryValue(request.query?.state)
    const oauthError = queryValue(request.query?.error)
    if (oauthError) return fail('Доступ в Threads не предоставлен')
    if (!code || !stateValue) return fail('Meta не вернула код авторизации')
    const state = verifyOAuthState(stateValue)
    const admin = createClient<Database>(supabaseUrl, secretKey, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data: membership } = await admin.from('workspace_members').select('role').eq('workspace_id', state.workspaceId).eq('user_id', state.userId).maybeSingle()
    if (!membership) return fail('Доступ к workspace отозван')

    const tokenResult = await fetch('https://graph.threads.net/oauth/access_token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: appId, client_secret: appSecret, grant_type: 'authorization_code', redirect_uri: redirectUri, code }) })
    const shortToken = await tokenResult.json() as { access_token?: string; user_id?: string; error_message?: string }
    if (!tokenResult.ok || !shortToken.access_token) throw new Error(shortToken.error_message || 'TOKEN_EXCHANGE_FAILED')

    const longUrl = new URL('https://graph.threads.net/access_token')
    longUrl.searchParams.set('grant_type', 'th_exchange_token')
    longUrl.searchParams.set('client_secret', appSecret)
    longUrl.searchParams.set('access_token', shortToken.access_token)
    const longResult = await fetch(longUrl)
    const longToken = await longResult.json() as { access_token?: string; expires_in?: number }
    const accessToken = longResult.ok && longToken.access_token ? longToken.access_token : shortToken.access_token
    const expiresIn = longResult.ok ? longToken.expires_in : 3600

    const profileUrl = new URL('https://graph.threads.net/v1.0/me')
    profileUrl.searchParams.set('fields', 'id,username,name,threads_profile_picture_url')
    profileUrl.searchParams.set('access_token', accessToken)
    const profileResult = await fetch(profileUrl)
    const profile = await profileResult.json() as { id?: string; username?: string; name?: string; threads_profile_picture_url?: string }
    if (!profileResult.ok || !profile.id || !profile.username) throw new Error('PROFILE_FETCH_FAILED')

    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null
    const { data: account, error: accountError } = await admin.from('threads_accounts').upsert({ workspace_id: state.workspaceId, threads_user_id: profile.id, username: profile.username, display_name: profile.name || profile.username, profile_picture_url: profile.threads_profile_picture_url || null, status: 'active', permissions: ['threads_basic', 'threads_content_publish'], token_expires_at: expiresAt, last_synced_at: new Date().toISOString(), last_error: null }, { onConflict: 'workspace_id,username' }).select('*').single()
    if (accountError) throw accountError
    const { error: tokenError } = await admin.rpc('store_threads_token', { p_account_id: account.id, p_access_token: encryptToken(accessToken), p_expires_at: expiresAt })
    if (tokenError) throw tokenError
    response.redirect(302, `${appOrigin}/app/accounts?threads=connected`)
  } catch {
    fail('Не удалось завершить подключение Threads')
  }
}
