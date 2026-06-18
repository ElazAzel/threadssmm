import type { ApiRequest, ApiResponse } from '../_lib/http.js'
import { enforceRateLimit, RateLimitError, requireUser } from '../_lib/supabaseServer.js'
import { newOAuthState } from '../_lib/threads.js'

export default async function handler(request: ApiRequest, response: ApiResponse) {
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
