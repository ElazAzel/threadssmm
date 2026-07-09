import { createClient } from '@supabase/supabase-js'
import type { ApiRequest, ApiResponse } from '../_lib/http.js'
import { getBearerToken } from '../_lib/http.js'
import { publishDraft } from '../_lib/threads.js'
import { publishBatch } from '../_lib/scheduler.js'
import type { Database } from '../../src/lib/database.types.js'

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (getBearerToken(request) !== process.env.CRON_SECRET) return response.status(401).json({ error: 'Unauthorized' })
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY
  if (!url || !key) return response.status(503).json({ error: 'Supabase is not configured' })
  const admin = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const results = await publishBatch(admin, publishDraft)
  response.status(200).json({ processed: results.length, results })
}
