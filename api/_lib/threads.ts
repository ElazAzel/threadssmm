import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../src/lib/database.types.js'

interface OAuthState {
  workspaceId: string
  userId: string
  expiresAt: number
  nonce: string
}

function secret() {
  const value = process.env.TOKEN_ENCRYPTION_KEY
  if (!value) throw new Error('THREADS_CRYPTO_NOT_CONFIGURED')
  return createHash('sha256').update(value).digest()
}

export function signOAuthState(state: OAuthState) {
  const payload = Buffer.from(JSON.stringify(state)).toString('base64url')
  const signature = createHmac('sha256', secret()).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

export function verifyOAuthState(value: string): OAuthState {
  const [payload, signature] = value.split('.')
  if (!payload || !signature) throw new Error('INVALID_OAUTH_STATE')
  const expected = createHmac('sha256', secret()).update(payload).digest()
  const provided = Buffer.from(signature, 'base64url')
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) throw new Error('INVALID_OAUTH_STATE')
  const state = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as OAuthState
  if (!state.workspaceId || !state.userId || state.expiresAt < Date.now()) throw new Error('INVALID_OAUTH_STATE')
  return state
}

export function newOAuthState(workspaceId: string, userId: string) {
  return signOAuthState({ workspaceId, userId, expiresAt: Date.now() + 10 * 60 * 1000, nonce: randomBytes(16).toString('hex') })
}

export function encryptToken(token: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', secret(), iv)
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()])
  return `${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${encrypted.toString('base64url')}`
}

export function decryptToken(value: string) {
  const [ivValue, tagValue, encryptedValue] = value.split('.')
  if (!ivValue || !tagValue || !encryptedValue) throw new Error('INVALID_ENCRYPTED_TOKEN')
  const decipher = createDecipheriv('aes-256-gcm', secret(), Buffer.from(ivValue, 'base64url'))
  decipher.setAuthTag(Buffer.from(tagValue, 'base64url'))
  return Buffer.concat([decipher.update(Buffer.from(encryptedValue, 'base64url')), decipher.final()]).toString('utf8')
}

async function graphJson(url: URL, init?: RequestInit) {
  const result = await fetch(url, init)
  const payload = await result.json() as { id?: string; error?: { message?: string } }
  if (!result.ok || payload.error) throw new Error(payload.error?.message || 'THREADS_API_ERROR')
  return payload
}

export async function publishDraft(admin: SupabaseClient<Database>, draftId: string) {
  const { data: draft } = await admin.from('drafts').select('*').eq('id', draftId).single()
  if (!draft) throw new Error('DRAFT_NOT_FOUND')
  if (!['approved', 'scheduled'].includes(draft.status)) throw new Error('DRAFT_NOT_APPROVED')
  if (!draft.content?.trim() || draft.content.length > 500) throw new Error('THREADS_TEXT_LIMIT')

  let accountId = draft.account_id as string | null
  if (!accountId) {
    const { data: fallbackAccount } = await admin.from('threads_accounts').select('id').eq('workspace_id', draft.workspace_id).eq('status', 'active').order('created_at').limit(1).maybeSingle()
    accountId = fallbackAccount?.id ?? null
    if (accountId) await admin.from('drafts').update({ account_id: accountId }).eq('id', draft.id)
  }
  if (!accountId) throw new Error('ACCOUNT_NOT_SELECTED')
  const { data: account } = await admin.from('threads_accounts').select('*').eq('id', accountId).single()
  if (!account || account.status !== 'active' || !account.threads_user_id) throw new Error('THREADS_ACCOUNT_NOT_CONNECTED')
  const { data: tokenRow } = await admin.rpc('get_threads_token', { p_account_id: account.id }).single()
  const token = tokenRow as { access_token: string; expires_at: string | null } | null
  if (!token) throw new Error('THREADS_TOKEN_NOT_FOUND')
  if (token.expires_at && new Date(token.expires_at).getTime() <= Date.now()) throw new Error('THREADS_TOKEN_EXPIRED')
  const accessToken = decryptToken(token.access_token)

  const authHeaders = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }

  const containerUrl = new URL(`https://graph.threads.net/v1.0/${account.threads_user_id}/threads`)
  containerUrl.searchParams.set('media_type', 'TEXT')
  containerUrl.searchParams.set('text', draft.content)
  const container = await graphJson(containerUrl, { method: 'POST', headers: authHeaders })
  if (!container.id) throw new Error('THREADS_CONTAINER_FAILED')

  const publishUrl = new URL(`https://graph.threads.net/v1.0/${account.threads_user_id}/threads_publish`)
  publishUrl.searchParams.set('creation_id', container.id)
  const published = await graphJson(publishUrl, { method: 'POST', headers: authHeaders })
  if (!published.id) throw new Error('THREADS_PUBLISH_FAILED')

  await Promise.all([
    admin.from('drafts').update({ status: 'published', published_at: new Date().toISOString(), threads_post_id: published.id, error_message: null }).eq('id', draft.id),
    admin.from('audit_logs').insert({ workspace_id: draft.workspace_id, actor_id: draft.created_by, action: 'threads.post_published', resource_type: 'draft', resource_id: draft.id, risk: 'low', details: { threads_post_id: published.id } }),
  ])
  return published.id
}
