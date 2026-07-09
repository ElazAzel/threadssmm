import { type SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '../../src/lib/database.types.js'

const MAX_PUBLISH_BATCH = 20
const MAX_RETRY_ATTEMPTS = 3
const RETRY_BACKOFF_MINUTES = [1, 5, 15]

export interface PublishJob {
  draftId: string
  attempt: number
  nextRetryAt: string | null
}

export async function collectDueJobs(admin: SupabaseClient<Database>): Promise<PublishJob[]> {
  const now = new Date().toISOString()
  const [scheduled, retry] = await Promise.all([
    admin.from('drafts').select('id').eq('status', 'scheduled').lte('scheduled_at', now).limit(MAX_PUBLISH_BATCH),
    admin.from('drafts').select('id, metadata').eq('status', 'failed').not('error_message', 'is', null).not('metadata->publish_retries', 'is', null).limit(MAX_PUBLISH_BATCH),
  ])
  const jobs: PublishJob[] = (scheduled.data ?? []).map((d) => ({ draftId: d.id, attempt: 0, nextRetryAt: null }))
  for (const draft of retry.data ?? []) {
    const meta = draft.metadata as { publish_retries?: number; next_retry_at?: string } | null
    if (!meta?.next_retry_at || meta.next_retry_at > now) continue
    if ((meta.publish_retries ?? 0) >= MAX_RETRY_ATTEMPTS) continue
    jobs.push({ draftId: draft.id, attempt: meta.publish_retries ?? 0, nextRetryAt: meta.next_retry_at })
  }
  return jobs
}

export async function scheduleRetry(admin: SupabaseClient<Database>, draftId: string, currentAttempt: number) {
  const nextAttempt = currentAttempt + 1
  if (nextAttempt > MAX_RETRY_ATTEMPTS) return
  const delayMinutes = RETRY_BACKOFF_MINUTES[currentAttempt] ?? RETRY_BACKOFF_MINUTES[RETRY_BACKOFF_MINUTES.length - 1]
  const nextRetryAt = new Date(Date.now() + delayMinutes * 60 * 1000).toISOString()
  const metadata = { publish_retries: nextAttempt, next_retry_at: nextRetryAt, last_retry_at: new Date().toISOString() }
  await admin.from('drafts').update({ metadata: metadata as Json, error_message: `Повтор через ${delayMinutes} мин.` }).eq('id', draftId)
}

export async function cancelExpiredRetries(admin: SupabaseClient<Database>) {
  const { data: expired } = await admin.from('drafts')
    .select('id, metadata')
    .eq('status', 'failed')
    .not('metadata->publish_retries', 'is', null)
    .gte('metadata->publish_retries', MAX_RETRY_ATTEMPTS)
  for (const draft of expired ?? []) {
    const meta = (draft.metadata ?? {}) as Json
    await admin.from('drafts').update({
      error_message: 'Публикация не удалась после нескольких попыток',
      metadata: { ...(typeof meta === 'object' && meta ? (meta as Record<string, unknown>) : {}), retries_exhausted: true, exhausted_at: new Date().toISOString() } as Json,
    }).eq('id', draft.id)
  }
}

export async function publishBatch(admin: SupabaseClient<Database>, publishFn: (admin: SupabaseClient<Database>, draftId: string) => Promise<string>) {
  const jobs = await collectDueJobs(admin)
  const results: Array<{ id: string; ok: boolean; postId?: string; error?: string }> = []

  for (const job of jobs) {
    try {
      const postId = await publishFn(admin, job.draftId)
      results.push({ id: job.draftId, ok: true, postId })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'UNKNOWN'
      const retryable = error instanceof Error && (error.message.includes('THREADS_CONTAINER_FAILED') || error.message.includes('THREADS_PUBLISH_FAILED') || error.message.includes('THREADS_API_ERROR'))
      if (retryable && job.attempt < MAX_RETRY_ATTEMPTS) {
        await scheduleRetry(admin, job.draftId, job.attempt)
        await admin.from('drafts').update({ error_message: message }).eq('id', job.draftId)
      } else {
        await admin.from('drafts').update({ status: 'failed', error_message: message }).eq('id', job.draftId)
      }
      results.push({ id: job.draftId, ok: false, error: message })
    }
  }

  await cancelExpiredRetries(admin)
  return results
}

export async function getPendingCount(admin: SupabaseClient<Database>): Promise<{ scheduled: number; failed: number; retryable: number }> {
  const now = new Date().toISOString()
  const [scheduled, failed, retryable] = await Promise.all([
    admin.from('drafts').select('id', { count: 'exact', head: true }).eq('status', 'scheduled').lte('scheduled_at', now),
    admin.from('drafts').select('id', { count: 'exact', head: true }).eq('status', 'failed'),
    admin.from('drafts').select('id', { count: 'exact', head: true }).eq('status', 'failed').not('error_message', 'is', null).lt('metadata->publish_retries', MAX_RETRY_ATTEMPTS),
  ])
  return { scheduled: scheduled.count ?? 0, failed: failed.count ?? 0, retryable: retryable.count ?? 0 }
}
