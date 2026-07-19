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
    if (!['7d', '30d', '90d'].includes(period)) return response.status(400).json({ error: 'Неверный период' })
    const since = new Date()
    since.setDate(since.getDate() - (period === '30d' ? 30 : period === '90d' ? 90 : 7))
    const sinceStr = since.toISOString()

    const { data: published } = await admin.from('drafts').select('id, title, published_at, threads_post_id').eq('workspace_id', body.workspaceId).eq('status', 'published').gte('published_at', sinceStr).order('published_at', { ascending: false })
    const postIds = (published ?? []).map((p) => p.id)

    const { data: metrics } = postIds.length > 0
      ? await admin.from('post_metrics').select('*').in('draft_id', postIds)
      : { data: [] }

    const metricsMap = new Map<string, { views: number; likes: number; replies: number; reposts: number; quotes: number }>()
    for (const m of metrics ?? []) {
      const draftId = (m as { draft_id?: string }).draft_id
      if (draftId) {
        const existing = metricsMap.get(draftId) ?? { views: 0, likes: 0, replies: 0, reposts: 0, quotes: 0 }
        metricsMap.set(draftId, {
          views: existing.views + ((m as { metric_name?: string; metric_value?: number }).metric_name === 'views' ? (m as { metric_value?: number }).metric_value ?? 0 : 0),
          likes: existing.likes + ((m as { metric_name?: string; metric_value?: number }).metric_name === 'likes' ? (m as { metric_value?: number }).metric_value ?? 0 : 0),
          replies: existing.replies + ((m as { metric_name?: string; metric_value?: number }).metric_name === 'replies' ? (m as { metric_value?: number }).metric_value ?? 0 : 0),
          reposts: existing.reposts + ((m as { metric_name?: string; metric_value?: number }).metric_name === 'reposts' ? (m as { metric_value?: number }).metric_value ?? 0 : 0),
          quotes: existing.quotes + ((m as { metric_name?: string; metric_value?: number }).metric_name === 'quotes' ? (m as { metric_value?: number }).metric_value ?? 0 : 0),
        })
      }
    }

    const totalViews = Array.from(metricsMap.values()).reduce((s, m) => s + m.views, 0)
    const totalLikes = Array.from(metricsMap.values()).reduce((s, m) => s + m.likes, 0)
    const totalReplies = Array.from(metricsMap.values()).reduce((s, m) => s + m.replies, 0)
    const totalReposts = Array.from(metricsMap.values()).reduce((s, m) => s + m.reposts, 0)
    const totalQuotes = Array.from(metricsMap.values()).reduce((s, m) => s + m.quotes, 0)
    const postsCount = published?.length ?? 0
    const engagementRate = totalViews > 0 ? ((totalLikes + totalReplies + totalReposts) / totalViews) * 100 : 0

    let topPost: { title: string; views: number; postId: string } | null = null
    let topViews = 0
    for (const post of published ?? []) {
      const m = metricsMap.get(post.id) ?? { views: 0, likes: 0, replies: 0, reposts: 0, quotes: 0 }
      if (m.views > topViews) {
        topViews = m.views
        topPost = { title: (post as { title?: string }).title ?? '', views: m.views, postId: (post as { threads_post_id?: string }).threads_post_id ?? '' }
      }
    }

    const periodInsights: PeriodInsights = {
      totalViews, totalLikes, totalReplies, totalReposts, totalQuotes,
      engagementRate: Math.round(engagementRate * 100) / 100,
      postsCount,
      avgViews: postsCount > 0 ? Math.round(totalViews / postsCount) : 0,
      avgLikes: postsCount > 0 ? Math.round(totalLikes / postsCount) : 0,
      topPost,
    }

    const daily: Record<string, ThreadsInsights> = {}
    for (const post of published ?? []) {
      const day = (post as { published_at?: string }).published_at?.slice(0, 10) ?? 'unknown'
      if (!daily[day]) daily[day] = { views: 0, likes: 0, replies: 0, reposts: 0, quotes: 0, followersDelta: 0, periodStart: day, periodEnd: day }
      const m = metricsMap.get(post.id) ?? { views: 0, likes: 0, replies: 0, reposts: 0, quotes: 0 }
      daily[day].views += m.views
      daily[day].likes += m.likes
      daily[day].replies += m.replies
      daily[day].reposts += m.reposts
      daily[day].quotes += m.quotes
    }

    const enrichedPosts = (published ?? []).map((post) => {
      const m = metricsMap.get(post.id) ?? { views: 0, likes: 0, replies: 0, reposts: 0, quotes: 0 }
      return { ...post, views: m.views, likes: m.likes, replies: m.replies, reposts: m.reposts, quotes: m.quotes }
    })

    response.status(200).json({ period: periodInsights, daily: Object.values(daily), posts: enrichedPosts.slice(0, 50) })
  } catch (error) {
    if (error instanceof RateLimitError) return response.status(429).json({ error: 'Слишком много запросов' })
    const message = error instanceof Error ? error.message : ''
    if (message === 'UNAUTHORIZED') return response.status(401).json({ error: 'Войдите в аккаунт' })
    if (message === 'SUPABASE_SERVER_NOT_CONFIGURED') return response.status(503).json({ error: 'Сервер не настроен' })
    response.status(500).json({ error: 'Ошибка получения аналитики' })
  }
}
