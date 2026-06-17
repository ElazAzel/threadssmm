import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Database, KeyRound, Server, Sparkles } from 'lucide-react'
import { Badge, Card } from '../components/ui'
import { demoMode, isSupabaseConfigured, supabaseConfig } from '../lib/env'

interface ServerHealthCheck {
  id: string
  label: string
  ok: boolean
  missing: string[]
}

interface ServerHealth {
  ok: boolean
  checkedAt: string
  checks: ServerHealthCheck[]
}

const fallbackServerChecks: ServerHealthCheck[] = [
  { id: 'supabase-server', label: 'Supabase server', ok: false, missing: ['SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_SECRET_KEY'] },
  { id: 'gemini', label: 'Gemini AI', ok: false, missing: ['GEMINI_API_KEY'] },
  { id: 'threads', label: 'Meta Threads API', ok: false, missing: ['THREADS_APP_ID', 'THREADS_APP_SECRET', 'THREADS_REDIRECT_URI', 'TOKEN_ENCRYPTION_KEY'] },
  { id: 'cron', label: 'Vercel Cron', ok: false, missing: ['CRON_SECRET'] },
]

export function SetupRequiredPage() {
  const [serverHealth, setServerHealth] = useState<ServerHealth | null>(null)
  const [healthError, setHealthError] = useState('')

  useEffect(() => {
    let mounted = true
    const localPreview = ['localhost', '127.0.0.1'].includes(window.location.hostname)

    if (demoMode || localPreview) {
      setHealthError('Серверная диагностика доступна после деплоя на Vercel.')
      return () => {
        mounted = false
      }
    }

    fetch('/api/health', { headers: { accept: 'application/json' } })
      .then(async (response) => {
        if (!response.ok) throw new Error('Health endpoint is not available')
        return response.json() as Promise<ServerHealth>
      })
      .then((data) => {
        if (mounted) setServerHealth(data)
      })
      .catch(() => {
        if (mounted) setHealthError('Серверная диагностика доступна после деплоя на Vercel.')
      })

    return () => {
      mounted = false
    }
  }, [])

  const clientChecks = useMemo<ServerHealthCheck[]>(() => [
    { id: 'client-url', label: 'VITE_SUPABASE_URL', ok: Boolean(supabaseConfig.url), missing: ['VITE_SUPABASE_URL'] },
    { id: 'client-key', label: 'VITE_SUPABASE_PUBLISHABLE_KEY', ok: Boolean(supabaseConfig.publishableKey), missing: ['VITE_SUPABASE_PUBLISHABLE_KEY'] },
  ], [])

  const serverChecks = serverHealth?.checks ?? fallbackServerChecks
  const readyCount = [...clientChecks, ...serverChecks].filter((item) => item.ok).length
  const totalCount = clientChecks.length + serverChecks.length
  const isReady = isSupabaseConfigured && serverChecks.every((item) => item.ok)

  return (
    <div className="auth-page setup-page">
      <Link to="/" className="landing-logo"><Sparkles size={20} /> Threads SMM Agent</Link>
      <Card className="auth-card setup-card">
        <span className="auth-icon"><Database /></span>
        <div className="setup-head">
          <Badge tone={isReady ? 'green' : 'orange'}>{readyCount}/{totalCount} готово</Badge>
          {demoMode && <Badge tone="blue">Demo mode</Badge>}
        </div>
        <h1>Требуется подключить production окружение</h1>
        <p>Frontend уже опубликован. Чтобы платформа работала с реальными пользователями, нужно подключить Supabase, серверные ключи, Gemini и Meta Threads API.</p>

        <section className="setup-status-grid" aria-label="Статус окружения">
          <SetupStatus title="Frontend Supabase" icon={<KeyRound size={18} />} checks={clientChecks} />
          <SetupStatus title="Server functions" icon={<Server size={18} />} checks={serverChecks} note={healthError} />
        </section>

        <ol className="setup-steps">
          <li>Создайте бесплатный проект Supabase и выполните миграцию из <code>supabase/migrations</code>.</li>
          <li>Добавьте в Vercel frontend-переменные <code>VITE_SUPABASE_URL</code> и <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>.</li>
          <li>Добавьте server-only переменные из <code>.env.example</code>. Не используйте префикс <code>VITE_</code> для секретов.</li>
          <li>Сделайте redeploy на Vercel и проверьте этот экран снова.</li>
        </ol>

        <p className="setup-note">Страница показывает только наличие переменных. Значения секретов не отдаются в браузер.</p>
      </Card>
    </div>
  )
}

function SetupStatus({
  title,
  icon,
  checks,
  note,
}: {
  title: string
  icon: React.ReactNode
  checks: ServerHealthCheck[]
  note?: string
}) {
  return (
    <div className="setup-status-card">
      <h2>{icon}{title}</h2>
      <div>
        {checks.map((check) => (
          <span className={`setup-check ${check.ok ? 'setup-check-ok' : 'setup-check-missing'}`} key={check.id}>
            {check.ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <b>{check.label}</b>
            <small>{check.ok ? 'настроено' : `не хватает: ${check.missing.join(', ')}`}</small>
          </span>
        ))}
      </div>
      {note && <p>{note}</p>}
    </div>
  )
}
