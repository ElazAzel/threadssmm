import type { ApiRequest, ApiResponse } from '../_lib/http.js'
import { enforceRateLimit, RateLimitError, requireUser } from '../_lib/supabaseServer.js'
import { publishDraft } from '../_lib/threads.js'
import { getPublicError } from '../_lib/threads-errors.js'

export default async function handler(request: ApiRequest, response: ApiResponse) {
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
