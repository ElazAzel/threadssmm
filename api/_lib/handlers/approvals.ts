/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ApiRequest, ApiResponse } from '../http.js'
import { enforceRateLimit, RateLimitError, requireUser } from '../supabaseServer.js'

function adminFrom(admin: any, table: string) {
  return admin.from(table)
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  response.setHeader('Cache-Control', 'no-store')
  try {
    const { user, admin } = await requireUser(request)
    await enforceRateLimit(admin, 'approval.comment', user.id, 20, 60)

    if (request.method === 'GET') {
      const approvalId = request.query?.approvalId as string | undefined
      if (!approvalId) return response.status(400).json({ error: 'approvalId обязателен' })
      const { data: comments, error } = await adminFrom(admin, 'approval_comments')
        .select('id, text, created_at, user_id, approval_id')
        .eq('approval_id', approvalId)
        .order('created_at', { ascending: true })
      if (error) return response.status(500).json({ error: 'Ошибка загрузки комментариев' })
      return response.status(200).json(comments ?? [])
    }

    if (request.method === 'POST') {
      const { approvalId, text } = request.body as { approvalId?: string; text?: string }
      if (typeof approvalId !== 'string' || typeof text !== 'string' || !text.trim()) {
        return response.status(400).json({ error: 'approvalId и text обязательны' })
      }
      const { data: comment, error } = await adminFrom(admin, 'approval_comments').insert({
        approval_id: approvalId,
        user_id: user.id,
        text: text.trim(),
      }).select().single()
      if (error) return response.status(500).json({ error: 'Ошибка сохранения комментария' })
      return response.status(201).json(comment)
    }

    if (request.method === 'DELETE') {
      const commentId = request.query?.id as string | undefined
      if (!commentId) return response.status(400).json({ error: 'id комментария обязателен' })
      const { error } = await adminFrom(admin, 'approval_comments').delete().eq('id', commentId).eq('user_id', user.id)
      if (error) return response.status(500).json({ error: 'Ошибка удаления комментария' })
      return response.status(200).json({ deleted: true })
    }

    return response.status(405).json({ error: 'Метод не поддерживается' })
  } catch (error) {
    if (error instanceof RateLimitError) return response.status(429).json({ error: 'Слишком много запросов' })
    const message = error instanceof Error ? error.message : ''
    if (message === 'UNAUTHORIZED') return response.status(401).json({ error: 'Войдите в аккаунт' })
    if (message === 'SUPABASE_SERVER_NOT_CONFIGURED') return response.status(503).json({ error: 'Сервер не настроен' })
    return response.status(500).json({ error: 'Ошибка обработки комментария' })
  }
}
