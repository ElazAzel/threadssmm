import { createClient } from '@supabase/supabase-js'
import type { ApiRequest, ApiResponse } from '../http.js'
import { getBearerToken } from '../http.js'
import { decryptToken } from '../threads.js'
import type { Database, Json } from '../../../src/lib/database.types.js'

interface ThreadsPostMetrics {
  views?: number
  likes?: number
  replies?: number
  reposts?: number
  quotes?: number
}

async function fetchPostMetrics(threadsUserId: string, postId: string, accessToken: string): Promise<ThreadsPostMetrics> {
  try {
    const url = new URL(`https://graph.threads.net/v1.0/${postId}`)
    url.searchParams.set('fields', 'like_count,reply_count,repost_count,quote_count')
    url.searchParams.set('access_token', accessToken)
    const res = await fetch(url.toString())
    const data = await res.json() as Record<string, unknown>
    return {
      likes: Number(data.like_count) || 0,
      replies: Number(data.reply_count) || 0,
      reposts: Number(data.repost_count) || 0,
      quotes: Number(data.quote_count) || 0,
    }
  } catch {
    return {}
  }
}

async function fetchProfileMetrics(threadsUserId: string, accessToken: string): Promise<{ followersCount: number }> {
  try {
    const url = new URL(`https://graph.threads.net/v1.0/${threadsUserId}`)
    url.searchParams.set('fields', 'followers_count')
    url.searchParams.set('access_token', accessToken)
    const res = await fetch(url.toString())
    const data = await res.json() as { followers_count?: number }
    return { followersCount: data.followers_count ?? 0 }
  } catch {
    return { followersCount: 0 }
  }
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (getBearerToken(request) !== process.env.CRON_SECRET) return response.status(401).json({ error: 'Unauthorized' })
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY
  if (!url || !key) return response.status(503).json({ error: 'Supabase not configured' })
  const admin = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

  const { data: accounts } = await admin.from('threads_accounts').select('id, threads_user_id, workspace_id').eq('status', 'active').not('threads_user_id', 'is', null)
  const results: Array<{ accountId: string; postsUpdated: number; error?: string }> = []

  for (const account of accounts ?? []) {
    if (!account.threads_user_id) continue
    try {
      const { data: tokenRow } = await admin.rpc('get_threads_token', { p_account_id: account.id }).single()
      const token = tokenRow as { access_token: string } | null
      if (!token) continue
      const accessToken = decryptToken(token.access_token)

      const { data: publishedPosts } = await admin.from('drafts')
        .select('id, threads_post_id')
        .eq('workspace_id', account.workspace_id)
        .eq('status', 'published')
        .not('threads_post_id', 'is', null)

      let postsUpdated = 0
      for (const post of publishedPosts ?? []) {
        if (!post.threads_post_id) continue
        const metrics = await fetchPostMetrics(account.threads_user_id, post.threads_post_id, accessToken)
        if (Object.keys(metrics).length > 0) {
          await admin.from('post_metrics').insert({
            workspace_id: account.workspace_id,
            draft_id: post.id,
            captured_at: new Date().toISOString(),
            views: metrics.views ?? 0,
            likes: metrics.likes ?? 0,
            replies: metrics.replies ?? 0,
            reposts: metrics.reposts ?? 0,
            quotes: metrics.quotes ?? 0,
            clicks: 0,
            followers_delta: 0,
            raw: metrics as unknown as Json,
          })
          await admin.from('drafts').update({
            metadata: { last_metrics_sync: new Date().toISOString(), ...metrics } as unknown as Json,
          }).eq('id', post.id)
          postsUpdated++
        }
      }

      const profileMetrics = await fetchProfileMetrics(account.threads_user_id, accessToken)
      if (profileMetrics.followersCount > 0) {
        await admin.from('usage_events').insert({
          workspace_id: account.workspace_id,
          user_id: account.id,
          provider: 'threads',
          model: 'insights',
          operation: 'sync_metrics',
          input_tokens: 0,
          output_tokens: 0,
          credits: 0,
          metadata: { followers_count: profileMetrics.followersCount, posts_synced: postsUpdated } as unknown as Json,
        })
      }

      results.push({ accountId: account.id, postsUpdated })
    } catch (error) {
      results.push({ accountId: account.id, postsUpdated: 0, error: error instanceof Error ? error.message : 'UNKNOWN' })
    }
  }

  response.status(200).json({ synced: results.length, details: results })
}
