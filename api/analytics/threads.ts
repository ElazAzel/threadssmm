import type { ApiRequest, ApiResponse } from '../_lib/http.js'
import { enforceRateLimit, RateLimitError, requireUser } from '../_lib/supabaseServer.js'

interface ThreadsInsights {
  views: number
  likes: number
  replies: number
  reposts: number
  quotes: number
  followersDelta: number
  periodStart: string
  periodEnd: string
}

interface PeriodInsights {
  totalViews: number
  totalLikes: number
  totalReplies: number
  totalReposts: number
  totalQuotes: number
  engagementRate: number
  postsCount: number
  avgViews: number
  avgLikes: number
  topPost: { title: string; views: number; postId: string } | null
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  response.setHeader('Cache-Control', 'no-store')
  if (request.method !== 'GET' && request.method !== 'POST') return response.status(405).json({ error: 'Метод не поддерживается' })
  try {
    const { user, admin } = await requireUser(request)
    const body = (request.method === 'POST' ? request.body : request.query) as { workspaceId?: string; period?: string }
    if (typeof body.workspaceId !== 'string') return response.status(400).json({ error: 'Рабочее пространство не указано' })
    const { data: membership } = await admin.from('workspace_members').select('role').eq('workspace_id', body.workspaceId).eq('user_id', user.id).maybeSingle()
    if (!membership) return response.status(403).json({ error: 'Нет доступа' })
    await enforceRateLimit(admin, 'analytics.view', user.id, 30, 60)

    const period = body.period || '7d'
    const since = new Date()
    since.setDate(since.getDate() - (period === '30d' ? 30 : period === '90d' ? 90 : 7))
    const sinceStr = since.toISOString()

    const { data: published } = await admin.from('drafts').select('id, title, views, likes, replies, reposts, quotes, published_at, threads_post_id').eq('workspace_id', body.workspaceId).eq('status', 'published').gte('published_at', sinceStr).order('published_at', { ascending: false })
    const posts = published ?? []
    const totalViews = posts.reduce((s, p) => s + ((p as { views?: number }).views ?? 0), 0)
    const totalLikes = posts.reduce((s, p) => s + ((p as { likes?: number }).likes ?? 0), 0)
    const totalReplies = posts.reduce((s, p) => s + ((p as { replies?: number }).replies ?? 0), 0)
    const totalReposts = posts.reduce((s, p) => s + ((p as { reposts?: number }).reposts ?? 0), 0)
    const totalQuotes = posts.reduce((s, p) => s + ((p as { quotes?: number }).quotes ?? 0), 0)
    const postsCount = posts.length
    const engagementRate = totalViews > 0 ? ((totalLikes + totalReplies + totalReposts) / totalViews) * 100 : 0
    const topPost = posts.length > 0 ? [...posts].sort((a, b) => ((b as { views?: number }).views ?? 0) - ((a as { views?: number }).views ?? 0))[0] : null

    const periodInsights: PeriodInsights = {
      totalViews, totalLikes, totalReplies, totalReposts, totalQuotes,
      engagementRate: Math.round(engagementRate * 100) / 100,
      postsCount,
      avgViews: postsCount > 0 ? Math.round(totalViews / postsCount) : 0,
      avgLikes: postsCount > 0 ? Math.round(totalLikes / postsCount) : 0,
      topPost: topPost ? { title: (topPost as { title?: string }).title ?? '', views: (topPost as { views?: number }).views ?? 0, postId: (topPost as { threads_post_id?: string }).threads_post_id ?? '' } : null,
    }

    const daily: Record<string, ThreadsInsights> = {}
    for (const post of posts) {
      const day = (post as { published_at?: string }).published_at?.slice(0, 10) ?? 'unknown'
      if (!daily[day]) daily[day] = { views: 0, likes: 0, replies: 0, reposts: 0, quotes: 0, followersDelta: 0, periodStart: day, periodEnd: day }
      daily[day].views += (post as { views?: number }).views ?? 0
      daily[day].likes += (post as { likes?: number }).likes ?? 0
      daily[day].replies += (post as { replies?: number }).replies ?? 0
      daily[day].reposts += (post as { reposts?: number }).reposts ?? 0
      daily[day].quotes += (post as { quotes?: number }).quotes ?? 0
    }

    response.status(200).json({ period: periodInsights, daily: Object.values(daily), posts: posts.slice(0, 50) })
  } catch (error) {
    if (error instanceof RateLimitError) return response.status(429).json({ error: 'Слишком много запросов' })
    const message = error instanceof Error ? error.message : ''
    if (message === 'UNAUTHORIZED') return response.status(401).json({ error: 'Войдите в аккаунт' })
    if (message === 'SUPABASE_SERVER_NOT_CONFIGURED') return response.status(503).json({ error: 'Сервер не настроен' })
    response.status(500).json({ error: 'Ошибка получения аналитики' })
  }
}
