import type { ApiRequest, ApiResponse } from '../_lib/http.js'
import { enforceRateLimit, RateLimitError, requireUser } from '../_lib/supabaseServer.js'
import { publishDraft } from '../_lib/threads.js'

export default async function handler(request: ApiRequest, response: ApiResponse) {
  response.setHeader('Cache-Control', 'no-store')
  if (request.method !== 'POST') return response.status(405).json({ error: 'Метод не поддерживается' })
  const body = request.body as { draftId?: unknown }
  if (typeof body?.draftId !== 'string') return response.status(400).json({ error: 'Черновик не указан' })
  try {
    const { user, admin } = await requireUser(request)
    const { data: draft } = await admin.from('drafts').select('workspace_id').eq('id', body.draftId).single()
    if (!draft) return response.status(404).json({ error: 'Черновик не найден' })
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
    const publicMessage: Record<string, string> = { DRAFT_NOT_APPROVED: 'Сначала согласуйте материал', ACCOUNT_NOT_SELECTED: 'Выберите Threads-аккаунт', THREADS_ACCOUNT_NOT_CONNECTED: 'Подключите официальный Threads OAuth', THREADS_TEXT_LIMIT: 'Текст должен быть от 1 до 500 символов', THREADS_TOKEN_EXPIRED: 'Токен Threads истёк, подключите аккаунт заново' }
    response.status(400).json({ error: publicMessage[message] || 'Threads не принял публикацию' })
  }
}
