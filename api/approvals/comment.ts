import type { ApiRequest, ApiResponse } from '../_lib/http.js'
import { enforceRateLimit, requireUser } from '../_lib/supabaseServer.js'

interface ApprovalComment {
  id: string
  approvalId: string
  authorId: string
  authorName: string
  body: string
  parentId: string | null
  createdAt: string
}

const MOCK_COMMENTS: ApprovalComment[] = [
  { id: 'c1', approvalId: 'ap1', authorId: 'u1', authorName: 'Алексей', body: 'Проверил — всё ок по регламенту', parentId: null, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'c2', approvalId: 'ap1', authorId: 'u2', authorName: 'Мария', body: 'Я бы убрала второй абзац, слишком длинно', parentId: 'c1', createdAt: new Date(Date.now() - 1800000).toISOString() },
]

export default async function handler(request: ApiRequest, response: ApiResponse) {
  response.setHeader('Cache-Control', 'no-store')

  if (request.method === 'GET') {
    try {
      const { user, admin } = await requireUser(request)
      const query = request.query as { approvalId?: string }
      if (typeof query.approvalId !== 'string') return response.status(400).json({ error: 'ID согласования не указан' })
      const { data: approval } = await admin.from('approvals').select('workspace_id').eq('id', query.approvalId).single()
      if (!approval) return response.status(404).json({ error: 'Согласование не найдено' })
      const { data: membership } = await admin.from('workspace_members').select('role').eq('workspace_id', approval.workspace_id).eq('user_id', user.id).maybeSingle()
      if (!membership) return response.status(403).json({ error: 'Нет доступа' })
      await enforceRateLimit(admin, 'approvals.comment.list', user.id, 60, 60)
      response.status(200).json({ comments: MOCK_COMMENTS.filter((c) => c.approvalId === query.approvalId) })
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      if (message === 'UNAUTHORIZED') return response.status(401).json({ error: 'Войдите в аккаунт' })
      response.status(500).json({ error: 'Ошибка загрузки комментариев' })
    }
    return
  }

  if (request.method === 'POST') {
    try {
      const { user, admin } = await requireUser(request)
      const body = request.body as { approvalId?: string; body?: string; parentId?: string | null }
      if (typeof body.approvalId !== 'string' || typeof body.body !== 'string' || !body.body.trim()) return response.status(400).json({ error: 'Некорректные данные' })
      const { data: approval } = await admin.from('approvals').select('workspace_id').eq('id', body.approvalId).single()
      if (!approval) return response.status(404).json({ error: 'Согласование не найдено' })
      const { data: membership } = await admin.from('workspace_members').select('role').eq('workspace_id', approval.workspace_id).eq('user_id', user.id).maybeSingle()
      if (!membership) return response.status(403).json({ error: 'Нет доступа' })
      await enforceRateLimit(admin, 'approvals.comment.create', user.id, 30, 60)

      const comment: ApprovalComment = {
        id: `c${Date.now()}`,
        approvalId: body.approvalId,
        authorId: user.id,
        authorName: user.user_metadata?.full_name ?? 'Пользователь',
        body: body.body.trim(),
        parentId: body.parentId ?? null,
        createdAt: new Date().toISOString(),
      }

      response.status(201).json({ comment })
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      if (message === 'UNAUTHORIZED') return response.status(401).json({ error: 'Войдите в аккаунт' })
      response.status(500).json({ error: 'Ошибка создания комментария' })
    }
    return
  }

  response.status(405).json({ error: 'Метод не поддерживается' })
}
