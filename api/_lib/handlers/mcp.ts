import type { ApiRequest, ApiResponse } from '../http.js'
import { getBearerToken } from '../http.js'
import { createClient } from '@supabase/supabase-js'
import type { ContentStatus, Database } from '../../../src/lib/database.types.js'

const MCP_VERSION = '1.0.0'
const SERVER_NAME = 'threadssmm'
const SERVER_VERSION = '0.1.0'

type McpTool = {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  handler: (args: Record<string, unknown>, admin: ReturnType<typeof createClient<Database>>, userId: string, workspaceId: string) => Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }>
}

async function requireWorkspaceAuth(request: ApiRequest) {
  const token = getBearerToken(request)
  if (!token) throw new Error('UNAUTHORIZED')
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY
  if (!url || !key) throw new Error('SUPABASE_SERVER_NOT_CONFIGURED')
  const admin = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: user, error } = await admin.auth.getUser(token)
  if (error || !user.user) throw new Error('UNAUTHORIZED')
  return { admin, userId: user.user.id }
}

const TOOLS: McpTool[] = [
  {
    name: 'list_posts',
    description: 'Список черновиков и опубликованных постов',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string', description: 'ID рабочего пространства' },
        status: { type: 'string', enum: ['draft', 'approved', 'scheduled', 'published', 'failed'], description: 'Фильтр по статусу' },
        limit: { type: 'number', default: 20 },
      },
      required: ['workspaceId'],
    },
    handler: async (args, admin) => {
      const status = args.status as string | undefined
      const limit = Math.min(Number(args.limit) || 20, 100)
      let query = admin.from('drafts').select('id, title, status, format, scheduled_at, published_at, risk_level').eq('workspace_id', args.workspaceId as string).order('created_at', { ascending: false }).limit(limit)
      if (status) query = query.eq('status', status as ContentStatus)
      const { data, error } = await query
      if (error) return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true }
      return { content: [{ type: 'text', text: JSON.stringify(data ?? [], null, 2) }] }
    },
  },
  {
    name: 'create_post',
    description: 'Создать новый черновик поста для Threads',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string', description: 'ID рабочего пространства' },
        content: { type: 'string', description: 'Текст поста (до 500 символов)' },
        title: { type: 'string', description: 'Заголовок для внутреннего использования' },
        scheduledAt: { type: 'string', description: 'Дата публикации в ISO формате (опционально)' },
      },
      required: ['workspaceId', 'content'],
    },
    handler: async (args, admin, userId) => {
      const content = (args.content as string).trim().slice(0, 500)
      const { data, error } = await admin.from('drafts').insert({
        workspace_id: args.workspaceId as string,
        created_by: userId,
        content,
        title: (args.title as string)?.slice(0, 200) || content.slice(0, 80),
        format: 'post',
        status: args.scheduledAt ? 'scheduled' : 'draft',
        source: 'api',
        scheduled_at: (args.scheduledAt as string) || null,
        risk_score: 0,
        risk_level: 'low',
        compliance_notes: [],
        metadata: {},
        variants: [],
      }).select('id').single()
      if (error) return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true }
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  },
  {
    name: 'list_brands',
    description: 'Список брендов в рабочем пространстве',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string', description: 'ID рабочего пространства' },
      },
      required: ['workspaceId'],
    },
    handler: async (args, admin) => {
      const { data, error } = await admin.from('brands').select('id, name, niche, tone_of_voice, content_pillars').eq('workspace_id', args.workspaceId as string)
      if (error) return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true }
      return { content: [{ type: 'text', text: JSON.stringify(data ?? [], null, 2) }] }
    },
  },
  {
    name: 'list_analytics',
    description: 'Аналитика публикаций за период',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string', description: 'ID рабочего пространства' },
        period: { type: 'string', enum: ['7d', '30d', '90d'], default: '7d' },
      },
      required: ['workspaceId'],
    },
    handler: async (args, admin) => {
      const period = (args.period as string) || '7d'
      const since = new Date()
      since.setDate(since.getDate() - (period === '30d' ? 30 : period === '90d' ? 90 : 7))
      const { data, error } = await admin.from('drafts').select('id, title, views, likes, replies, reposts, quotes, published_at').eq('workspace_id', args.workspaceId as string).eq('status', 'published').gte('published_at', since.toISOString())
      if (error) return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true }
      const posts = data ?? []
      const totalViews = posts.reduce((s, p) => s + ((p as { views?: number }).views ?? 0), 0)
      const totalLikes = posts.reduce((s, p) => s + ((p as { likes?: number }).likes ?? 0), 0)
      const totalReplies = posts.reduce((s, p) => s + ((p as { replies?: number }).replies ?? 0), 0)
      const engagementRate = totalViews > 0 ? ((totalLikes + totalReplies) / totalViews) * 100 : 0
      return { content: [{ type: 'text', text: JSON.stringify({ postsCount: posts.length, totalViews, totalLikes, totalReplies, engagementRate: Math.round(engagementRate * 100) / 100 }, null, 2) }] }
    },
  },
  {
    name: 'list_accounts',
    description: 'Список подключённых Threads-аккаунтов',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string', description: 'ID рабочего пространства' },
      },
      required: ['workspaceId'],
    },
    handler: async (args, admin) => {
      const { data, error } = await admin.from('threads_accounts').select('id, username, display_name, status, brand_id').eq('workspace_id', args.workspaceId as string)
      if (error) return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true }
      return { content: [{ type: 'text', text: JSON.stringify(data ?? [], null, 2) }] }
    },
  },
]

const toolMap = new Map(TOOLS.map((t) => [t.name, t]))

export default async function handler(request: ApiRequest, response: ApiResponse) {
  response.setHeader('Cache-Control', 'no-store')
  try {
    const { admin, userId } = await requireWorkspaceAuth(request)
    const body = request.body as { method?: string; params?: Record<string, unknown>; id?: string }

    if (body.method === 'initialize') {
      return response.status(200).json({
        jsonrpc: '2.0',
        id: body.id ?? '1',
        result: {
          protocolVersion: MCP_VERSION,
          capabilities: { tools: {} },
          serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
        },
      })
    }

    if (body.method === 'tools/list') {
      return response.status(200).json({
        jsonrpc: '2.0',
        id: body.id ?? '1',
        result: { tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })) },
      })
    }

    if (body.method === 'tools/call') {
      const toolName = body.params?.name as string
      const args = body.params?.arguments as Record<string, unknown> ?? {}
      const tool = toolMap.get(toolName)
      if (!tool) {
        return response.status(200).json({
          jsonrpc: '2.0',
          id: body.id ?? '1',
          error: { code: -32601, message: `Tool not found: ${toolName}` },
        })
      }
      const workspaceId = args.workspaceId as string
      if (!workspaceId) {
        const { data: membership } = await admin.from('workspace_members').select('workspace_id').eq('user_id', userId).limit(1).maybeSingle()
        if (!membership) return response.status(403).json({ error: 'Нет доступа к рабочему пространству' })
        args.workspaceId = (membership as { workspace_id: string }).workspace_id
      }
      const result = await tool.handler(args, admin, userId, workspaceId)
      return response.status(200).json({ jsonrpc: '2.0', id: body.id ?? '1', result })
    }

    response.status(200).json({
      jsonrpc: '2.0',
      id: body.id ?? '1',
      error: { code: -32601, message: `Method not found: ${body.method}` },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN'
    if (message === 'UNAUTHORIZED') return response.status(401).json({ error: 'Unauthorized' })
    response.status(500).json({ error: message })
  }
}
