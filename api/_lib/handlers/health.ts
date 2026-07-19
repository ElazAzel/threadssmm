import type { ApiRequest, ApiResponse } from '../http.js'

interface HealthCheck {
  id: string
  label: string
  ok: boolean
  missing: string[]
}

function hasEnv(name: string) {
  return Boolean(process.env[name]?.trim())
}

function checkEnv(id: string, label: string, names: string[]): HealthCheck {
  const missing = names.filter((name) => !hasEnv(name))
  return { id, label, ok: missing.length === 0, missing }
}

export default function handler(_request: ApiRequest, response: ApiResponse) {
  response.setHeader('Cache-Control', 'no-store')
  response.status(200).json({
    ok: true,
    checkedAt: new Date().toISOString(),
    checks: [
      checkEnv('supabase-server', 'Supabase server', ['SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_SECRET_KEY']),
      checkEnv('gemini', 'Gemini AI', ['GEMINI_API_KEY']),
      checkEnv('threads', 'Meta Threads API', ['THREADS_APP_ID', 'THREADS_APP_SECRET', 'THREADS_REDIRECT_URI', 'TOKEN_ENCRYPTION_KEY']),
      checkEnv('cron', 'Vercel Cron', ['CRON_SECRET']),
    ],
  })
}
