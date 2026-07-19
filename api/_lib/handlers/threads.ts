import { createClient } from '@supabase/supabase-js'
import type { ApiRequest, ApiResponse } from '../http.js'
import { enforceRateLimit, RateLimitError, requireUser } from '../supabaseServer.js'
import { newOAuthState, encryptToken, verifyOAuthState, publishDraft } from '../threads.js'
import { getPublicError } from '../threads-errors.js'
import type { Database } from '../../../src/lib/database.types.js'

function queryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export async function connectHandler(request: ApiRequest, response: ApiResponse) {
  response.setHeader('Cache-Control', 'no-store')
  if (request.method !== 'POST') return response.status(405).json({ error: 'Метод не поддерживается' })
  const body = request.body as { workspaceId?: unknown }
  if (typeof body?.workspaceId !== 'string') return response.status(400).json({ error: 'Workspace не указан' })
  try {
    const appId = process.env.THREADS_APP_ID
    const redirectUri = process.env.THREADS_REDIRECT_URI
    if (!appId || !redirectUri) return response.status(503).json({ error: 'Meta App ещё не настроен' })
    const { user, admin } = await requireUser(request)
    const { data: membership } = await admin.from('workspace_members').select('role').eq('workspace_id', body.workspaceId).eq('user_id', user.id).maybeSingle()
    if (!membership) return response.status(403).json({ error: 'Нет доступа к рабочему пространству' })
    await enforceRateLimit(admin, 'threads.connect', user.id, 5, 600)
    const url = new URL('https://threads.net/oauth/authorize')
    url.searchParams.set('client_id', appId)
    url.searchParams.set('redirect_uri', redirectUri)
    url.searchParams.set('scope', 'threads_basic,threads_content_publish')
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('state', newOAuthState(body.workspaceId, user.id))
    response.status(200).json({ url: url.toString() })
  } catch (error) {
    if (error instanceof RateLimitError) {
      response.setHeader('Retry-After', String(error.retryAfter))
      return response.status(429).json({ error: `Слишком много запросов. Повторите через ${error.retryAfter} сек.` })
    }
    response.status(error instanceof Error && error.message === 'UNAUTHORIZED' ? 401 : 500).json({ error: error instanceof Error && error.message === 'UNAUTHORIZED' ? 'Войдите в аккаунт заново' : 'Не удалось начать OAuth' })
  }
}

export async function publishHandler(request: ApiRequest, response: ApiResponse) {
  response.setHeader('Cache-Control', 'no-store')
  if (request.method !== 'POST') return response.status(405).json({ error: 'Метод не поддерживается' })
  const body = request.body as { draftId?: unknown }
  if (typeof body?.draftId !== 'string') return response.status(400).json({ error: 'Черновик не указан' })
  try {
    const { user, admin } = await requireUser(request)
    const { data: draft, error: draftError } = await admin.from('drafts').select('workspace_id, status, content, scheduled_at').eq('id', body.draftId).single()
    if (draftError || !draft) return response.status(404).json({ error: 'Черновик не найден' })
    const { data: membership } = await admin.from('workspace_members').select('role').eq('workspace_id', draft.workspace_id).eq('user_id', user.id).maybeSingle()
    if (!membership) return response.status(403).json({ error: 'Нет доступа к публикации' })
    await enforceRateLimit(admin, 'threads.publish', user.id, 20, 60)
    const postId = await publishDraft(admin, body.draftId)
    response.status(200).json({ postId })
  } catch (error) {
    if (error instanceof RateLimitError) {
      response.setHeader('Retry-After', String(error.retryAfter))
      return response.status(429).json({ error: `Слишком много запросов. Повторите через ${error.retryAfter} сек.` })
    }
    const message = error instanceof Error ? error.message : ''
    response.status(400).json({ error: getPublicError(message) || 'Threads не принял публикацию' })
  }
}

export async function callbackHandler(request: ApiRequest, response: ApiResponse) {
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
