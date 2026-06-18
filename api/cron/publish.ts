import { createClient } from '@supabase/supabase-js'
import type { ApiRequest, ApiResponse } from '../_lib/http.js'
import { getBearerToken } from '../_lib/http.js'
import { publishDraft } from '../_lib/threads.js'
import type { Database } from '../../src/lib/database.types.js'

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (getBearerToken(request) !== process.env.CRON_SECRET) return response.status(401).json({ error: 'Unauthorized' })
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY
  if (!url || !key) return response.status(503).json({ error: 'Supabase is not configured' })
  const admin = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: drafts } = await admin.from('drafts').select('id').eq('status', 'scheduled').lte('scheduled_at', new Date().toISOString()).limit(20)
  const results = []
  for (const draft of drafts ?? []) {
    try {
      results.push({ id: draft.id, postId: await publishDraft(admin, draft.id), ok: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'UNKNOWN'
      await admin.from('drafts').update({ status: 'failed', error_message: message }).eq('id', draft.id)
      results.push({ id: draft.id, ok: false, error: message })
    }
  }
  response.status(200).json({ processed: results.length, results })
}
