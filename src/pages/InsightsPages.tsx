import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, Bot, Check, CheckCircle2, Copy, Download, Eye, FileText, Image as ImageIcon, KeyRound, Sparkles, Trash2, Upload } from 'lucide-react'
import { AppShell } from '../components/AppShell'
import { Badge, Button, Card, Progress, SectionTitle } from '../components/ui'
import { mediaAssets } from '../data'
import { useAuth } from '../contexts/AuthContext'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { authenticatedJson } from '../lib/api'
import { generateHtmlReport, downloadPdfReport, buildReportData } from '../lib/pdf-export'
import { calculateBestTime, getDefaultBestTime, formatBestTimeSuggestion, type BestTimeResult } from '../lib/best-time'
import { PLANS, TOKEN_PACKS } from '../lib/pricing'

export function AnalyticsPage() {
  const { getAccessToken } = useAuth()
  const { demo } = useAuth()
  const { workspace, drafts } = useWorkspace()
  const [period, setPeriod] = useState('7d')
  const [notice, setNotice] = useState('')
  const [analyticsData, setAnalyticsData] = useState<{
    totalViews: number; totalLikes: number; totalReplies: number; totalReposts: number; totalQuotes: number;
    engagementRate: number; postsCount: number; avgViews: number; avgLikes: number;
    daily: Array<{ views: number; likes: number; periodStart: string }>;
    topPost: { title: string; views: number } | null;
  } | null>(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  const [reportFormat, setReportFormat] = useState<'csv' | 'pdf'>('csv')

  const fetchAnalytics = useCallback(async () => {
    if (demo || !workspace) return
    setLoadingAnalytics(true)
    try {
      const data = await authenticatedJson(getAccessToken, '/api/analytics/threads', { workspaceId: workspace.id, period })
      setAnalyticsData(data as typeof analyticsData)
    } catch {
      // ignore — stale data is better than no data
    } finally {
      setLoadingAnalytics(false)
    }
  }, [getAccessToken, workspace, period, demo])

  useEffect(() => { fetchAnalytics() }, [fetchAnalytics])

  const published = drafts.filter((draft) => draft.status === 'published')
  const failed = drafts.filter((draft) => draft.status === 'failed')
  const pendingApproval = drafts.filter((draft) => draft.status === 'pending_approval')
  const scheduled = drafts.filter((draft) => draft.status === 'scheduled')
  const retrying = drafts.filter((d) => d.status === 'failed' && d.error_message?.includes('Повтор'))

  const totalViews = analyticsData?.totalViews ?? (demo ? 1200000 : published.length * 50)
  const totalLikes = analyticsData?.totalLikes ?? (demo ? 45000 : 0)
  const engagementRate = analyticsData?.engagementRate ?? (demo ? 4.8 : 0)
  const daily = analyticsData?.daily ?? (demo ? [{ views: 38000, likes: 1450, periodStart: '2026-07-03' }, { views: 52000, likes: 2100, periodStart: '2026-07-04' }, { views: 34000, likes: 980, periodStart: '2026-07-05' }, { views: 65000, likes: 3100, periodStart: '2026-07-06' }, { views: 47000, likes: 1800, periodStart: '2026-07-07' }, { views: 61000, likes: 2400, periodStart: '2026-07-08' }, { views: 86000, likes: 4200, periodStart: '2026-07-09' }] : [])

  const maxViews = Math.max(...daily.map((d) => d.views), 1)

  const bestTime: BestTimeResult = demo ? getDefaultBestTime() : calculateBestTime(published.map((d) => ({
    hour: new Date(d.published_at ?? Date.now()).getHours(),
    dayOfWeek: new Date(d.published_at ?? Date.now()).getDay(),
  })))

  const exportReport = (format: 'csv' | 'pdf' = 'csv') => {
    if (format === 'pdf') {
      const data = buildReportData(drafts, workspace?.name ?? 'Workspace', period === '7d' ? '7 дней' : period === '30d' ? '30 дней' : '90 дней')
      const html = generateHtmlReport(data)
      downloadPdfReport(html, `threads-report-${new Date().toISOString().slice(0, 10)}`)
      setNotice('HTML-отчёт скачан (откройте в браузере → Печать → Сохранить как PDF)')
    } else {
      const rows = [['Название', 'Статус', 'Запланировано', 'Опубликовано'], ...drafts.map((draft) => [draft.title, draft.status, draft.scheduled_at ?? '', draft.published_at ?? ''])]
      const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n')
      const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }))
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = 'threads-smm-report.csv'
      anchor.click()
      URL.revokeObjectURL(url)
      setNotice('CSV-отчёт скачан')
    }
    window.setTimeout(() => setNotice(''), 2400)
  }

  return (
    <AppShell title="Обзор аналитики">
      <div className="analytics-toolbar">
        <div className="segmented">
          {[['7d', '7Д'], ['30d', '30Д'], ['90d', '90Д']].map(([value, label]) => (
            <button key={value} className={period === value ? 'active' : ''} onClick={() => setPeriod(value)}>{label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div className="segmented" style={{ margin: 0 }}>
            <button className={reportFormat === 'csv' ? 'active' : ''} onClick={() => setReportFormat('csv')}>CSV</button>
            <button className={reportFormat === 'pdf' ? 'active' : ''} onClick={() => setReportFormat('pdf')}>PDF</button>
          </div>
          <Button variant="secondary" onClick={() => exportReport(reportFormat)}><Download size={17} /> Экспорт</Button>
          {!demo && <Button variant="secondary" onClick={fetchAnalytics} disabled={loadingAnalytics}>Обновить</Button>}
        </div>
      </div>

      <div className="metric-grid analytics-metrics">
        <Card className="metric-card"><span>Всего черновиков <FileText /></span><strong>{demo ? 342 : drafts.length}</strong></Card>
        <Card className="metric-card"><span>Опубликовано <BarChart3 /></span><strong>{demo ? '4.8%' : published.length}</strong></Card>
        <Card className="metric-card"><span>Просмотры <Eye /></span><strong>{totalViews.toLocaleString('ru-RU')}</strong></Card>
        <Card className="metric-card"><span>Вовлечённость <Sparkles /></span><strong>{engagementRate}%</strong></Card>
        <Card className="metric-card"><span>AI-кредиты <Sparkles /></span><strong>{workspace?.ai_credits ?? 0} <small>/200</small></strong><Progress value={Math.min(100, ((workspace?.ai_credits ?? 0) / 200) * 100)} /></Card>
        <Card className="metric-card" style={{ gridColumn: 'span 2' }}>
          <span>⏰ Лучшее время публикации</span>
          <strong style={{ fontSize: '0.95rem' }}>{formatBestTimeSuggestion(bestTime)}</strong>
          <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.3rem' }}>
            {bestTime.slots.slice(0, 5).map((slot, i) => (
              <span key={i} style={{
                flex: 1, height: `${Math.max(4, (slot.score / Math.max(...bestTime.slots.map(s => s.score), 1)) * 24)}px`,
                background: i === 0 ? 'var(--accent)' : '#333', borderRadius: 3, minWidth: 16,
                position: 'relative',
              }} title={`День ${slot.dayOfWeek}, ${slot.hour}:00 — score: ${Math.round(slot.score)}`} />
            ))}
          </div>
        </Card>
      </div>

      <div className="analytics-layout">
        <div>
          <Card className="chart-card">
            <SectionTitle title="Активность публикаций" />
            <div className="bar-chart">
              {daily.map((d, i) => (
                <span key={d.periodStart} className={i === daily.length - 1 ? 'active' : ''} style={{ height: `${Math.max(3, (d.views / maxViews) * 100)}%` }} title={`${d.periodStart}: ${d.views.toLocaleString('ru-RU')} просмотров`} />
              ))}
            </div>
          </Card>
          <div className="analytics-lower">
            <Card>
              <SectionTitle title="Статусы" />
              {[
                ['Черновики', drafts.filter((d) => d.status === 'draft').length, 'var(--accent)'],
                ['На согласовании', pendingApproval.length, '#f59e0b'],
                ['Запланировано', scheduled.length, '#3b82f6'],
                ['Опубликовано', published.length, '#22c55e'],
                ['Ошибка', failed.length, '#ef4444'],
              ].map(([label, value, color]) => (
                <div className="topic-progress" key={label as string}>
                  <span>{label}<b>{value as number}</b></span>
                  <Progress value={drafts.length ? ((value as number) / drafts.length) * 100 : 0} tone={(color as string) === '#22c55e' ? 'green' : (color as string) === '#ef4444' ? 'orange' : 'blue'} />
                </div>
              ))}
            </Card>
            <Card>
              <SectionTitle title="Данные Meta" />
              <p>{demo ? 'В демо показаны примерные графики.' : (analyticsData ? `Загрузка данных за ${period} из Threads Insights API` : 'Просмотры и вовлечённость появятся после подключения Threads Insights и первой публикации.')}</p>
            </Card>
          </div>
        </div>
        <Card className="ai-insights">
          <SectionTitle icon={<Bot />} title="Состояние контента" />
          {published.length > 0 && <div className="insight-note success"><b>Готово</b><p>{published.length} публикаций отправлено в Threads. {totalLikes > 0 ? `Всего лайков: ${totalLikes.toLocaleString('ru-RU')}` : ''}</p></div>}
          {failed.length > 0 && (
            <div className="insight-note danger">
              <b>Требует внимания</b>
              <p>{failed.length} публикаций с ошибкой. {retrying.length > 0 ? `${retrying.length} в очереди на повтор.` : ''}</p>
            </div>
          )}
          {retrying.length > 0 && <div className="insight-note warn"><b>Повторы</b><p>{retrying.length} публикаций ожидают повторной отправки (через 1–15 мин.)</p></div>}
          <div className="insight-note next"><b>Следующий шаг</b><p>{drafts.length ? `Проверьте очередь согласований (${pendingApproval.length}) и расписание (${scheduled.length}).` : 'Создайте первый черновик в AI Studio.'}</p></div>
        </Card>
      </div>

      <Card className="table-wrap">
        <SectionTitle title="Публикации" />
        {drafts.length ? (
          <table>
            <thead><tr><th>Публикация</th><th>Формат</th><th>Дата</th><th>Threads ID</th><th>Статус</th></tr></thead>
            <tbody>
              {drafts.slice(0, 20).map((draft) => (
                <tr key={draft.id}>
                  <td><b>{draft.title || 'Без названия'}</b></td>
                  <td>{draft.format}</td>
                  <td>{new Date(draft.published_at || draft.scheduled_at || draft.created_at).toLocaleString('ru-RU')}</td>
                  <td>{draft.threads_post_id || '—'}</td>
                  <td>
                    <Badge tone={draft.status === 'published' ? 'green' : draft.status === 'failed' ? 'red' : draft.status === 'scheduled' ? 'blue' : draft.status === 'draft' ? 'neutral' : 'orange'}>
                      {draft.error_message?.includes('Повтор') ? 'повтор...' : draft.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div className="empty-state"><h2>Данных пока нет</h2><p>Аналитика начнёт заполняться после создания и публикации контента.</p></div>}
      </Card>
      {notice ? <div className="toast">{notice}</div> : null}
    </AppShell>
  )
}

export function MediaPage() {
  const { demo } = useAuth()
  const { mediaAssets: storedAssets, brands, uploadMedia, deleteMedia } = useWorkspace()
  const assets = demo ? mediaAssets.map((item) => ({ id: String(item.id), title: item.title, url: item.image, prompt: item.prompt, created_at: new Date().toISOString(), mime_type: 'image/png', size_bytes: 0, storage_path: '', workspace_id: '', brand_id: null, created_by: '', width: 1024, height: 1024, source: 'demo', metadata: {} })) : storedAssets
  const [selectedId, setSelectedId] = useState<string | null>(assets[0]?.id ?? null)
  const [copied, setCopied] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [notice, setNotice] = useState('')
  const [brandId] = useState(brands[0]?.id ?? '')
  const fileInput = useRef<HTMLInputElement>(null)
  const selected = assets.find((item) => item.id === selectedId)
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const asset = await uploadMedia(file, undefined, brandId || null)
      setSelectedId(asset.id)
      setNotice('Файл загружен')
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : 'Ошибка загрузки')
    } finally {
      setUploading(false); window.setTimeout(() => setNotice(''), 2800)
    }
  }
  const handleDelete = async () => {
    if (!selected) return
    try {
      await deleteMedia(selected)
      setSelectedId(assets.find((item) => item.id !== selected.id)?.id ?? null)
      setNotice('Файл удалён')
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : 'Ошибка удаления')
    }
    window.setTimeout(() => setNotice(''), 2800)
  }
  return (
    <AppShell title="Медиатека">
      <div className="media-layout">
        <div className="media-grid">
          <Card className="media-upload" onClick={() => fileInput.current?.click()} role="button" tabIndex={0}>
            <Upload size={28} /><p>Загрузить</p><small>PNG, JPG, GIF, MP4</small>
            <input ref={fileInput} type="file" hidden accept="image/png,image/jpeg,image/gif,video/mp4" onChange={handleUpload} disabled={uploading} />
          </Card>
          {assets.map((item) => (
            <div key={item.id} className={`media-thumb ${selectedId === item.id ? 'selected' : ''}`} onClick={() => setSelectedId(item.id)} role="button" tabIndex={0}>
              {item.mime_type.startsWith('video/') ? <span className="media-play-icon">▶</span> : null}
              <img src={item.url} alt={item.title} loading="lazy" />
            </div>
          ))}
        </div>
        <Card className="media-detail">
          {selected ? <>
            {selected.mime_type.startsWith('video/') ? <div className="detail-video"><span>▶</span><p>{selected.mime_type}</p></div> : <img src={selected.url} alt={selected.title} />}
            <h2>{selected.title}</h2>
            <div className="media-meta">
              <span>Тип: {selected.mime_type}</span>
              <span>Размер: {selected.size_bytes > 1048576 ? `${(selected.size_bytes / 1048576).toFixed(1)} МБ` : `${(selected.size_bytes / 1024).toFixed(0)} КБ`}</span>
              {selected.width ? <span>{selected.width}×{selected.height}</span> : null}
              <span>{new Date(selected.created_at).toLocaleString('ru-RU')}</span>
            </div>
            {selected.prompt ? <p className="media-prompt"><small>Источник: {selected.source} — {selected.prompt}</small></p> : null}
            <div className="media-actions">
              <Button variant="secondary" onClick={() => { void navigator.clipboard.writeText(selected.url); setCopied(true); window.setTimeout(() => setCopied(false), 1800) }}><Copy size={16} />{copied ? 'Скопировано' : 'URL'}</Button>
              <Button variant="secondary" disabled><Download size={16} /> Скачать</Button>
              <Button variant="secondary" onClick={handleDelete}><Trash2 size={16} /> Удалить</Button>
            </div>
          </> : <div className="empty-state"><ImageIcon size={48} /><h2>Выберите файл</h2></div>}
        </Card>
      </div>
      {notice ? <div className="toast">{notice}</div> : null}
    </AppShell>
  )
}

export function BillingPage() {
  const { workspace } = useWorkspace()
  const { getAccessToken, demo } = useAuth()
  const [loading, setLoading] = useState('')
  const [notice, setNotice] = useState('')

  const subscribe = async (planId: string) => {
    if (!workspace) return
    if (demo) { setNotice('Демо-режим: платежи отключены'); window.setTimeout(() => setNotice(''), 3500); return }
    setLoading(planId)
    try {
      const payload = await authenticatedJson<{ url: string }>(getAccessToken, '/api/billing/create-checkout', {
        workspaceId: workspace.id, planId,
      })
      window.location.assign(payload.url)
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : 'Ошибка подключения платежей')
    } finally {
      setLoading('')
      window.setTimeout(() => setNotice(''), 3500)
    }
  }

  return (
    <AppShell title="Тарифы и биллинг">
      <div className="page-head"><div><h1>Тарифы</h1><p>Чистая прибыль с каждого пользователя — более 85%. Остальное — токены AI, инфраструктура, эквайринг и налоги.</p></div></div>

      <div className="pricing-grid">
        {PLANS.map((plan) => (
          <Card key={plan.id} className={`pricing-card${plan.id === 'pro' ? ' featured' : ''}`}>
            {plan.id === 'pro' && <Badge tone="violet">Рекомендуем</Badge>}
            <h2>{plan.name}</h2>
            <div className="price">
              <span className="amount">${plan.price}</span>
              <span className="period">/мес</span>
            </div>
            <p className="tokens-included">{plan.tokensPerMonth} токенов в месяц</p>
            <ul className="plan-features">
              {plan.features.map((f) => <li key={f}><Check size={16} /> {f}</li>)}
            </ul>
            <Button
              className="full-button"
              onClick={() => void subscribe(plan.id)}
              disabled={loading === plan.id}
            >
              {loading === plan.id ? 'Открываем Stripe...' : 'Выбрать'}
            </Button>
          </Card>
        ))}
      </div>

      <h2 className="standalone-title">Купить токены дополнительно</h2>
      <div className="token-packs">
        {TOKEN_PACKS.map((pack) => (
          <Card key={pack.id} className="token-pack-card">
            <span className="token-count">{pack.tokens}</span>
            <span className="token-label">токенов</span>
            <span className="token-price">${pack.price}</span>
            <span className="token-per">{`(${(pack.price / pack.tokens).toFixed(2)} $/токен)`}</span>
            <Button
              variant="secondary"
              onClick={() => void subscribe(pack.id)}
              disabled={loading === pack.id}
            >
              {loading === pack.id ? '...' : 'Купить'}
            </Button>
          </Card>
        ))}
      </div>

      <Card className="margin-card">
        <h3>Как расходуются ваши средства</h3>
        <div className="margin-breakdown">
          <div className="margin-bar">
            <div className="margin-fill" style={{ width: '15%' }} />
          </div>
          <div className="margin-legend">
            <span><span className="dot green" /> Вы получаете (85%)</span>
            <span><span className="dot accent" /> AI-токены и API (~4%)</span>
            <span><span className="dot blue" /> Инфраструктура (~1%)</span>
            <span><span className="dot orange" /> Эквайринг (~5%)</span>
            <span><span className="dot gray" /> Налоги (~5%)</span>
          </div>
        </div>
      </Card>

      {notice ? <div className="toast">{notice}</div> : null}
    </AppShell>
  )
}

export function SettingsPage() {
  const { workspace, accounts, auditLogs, brands } = useWorkspace()
  const navigate = useNavigate()
  const activeAccount = accounts.find((account) => account.status === 'active')
  const [tab, setTab] = useState(() => window.matchMedia('(max-width: 720px)').matches ? 'Workspace' : 'Threads API')
  const [secretVisible, setSecretVisible] = useState(false)
  const tabs = ['Workspace', 'Безопасность', 'AI-провайдеры', 'Threads API', 'Уведомления', 'Аудит', 'Голос бренда']
  const exportAudit = () => {
    const rows = [['Время', 'Пользователь', 'Действие', 'Ресурс', 'ID', 'Риск'], ...auditLogs.map((entry) => [entry.created_at, entry.actor_id ?? 'system', entry.action, entry.resource_type, entry.resource_id ?? '', entry.risk])]
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'threads-smm-audit.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }
  return (
    <AppShell>
      <div className="page-head"><div><h1>Настройки {workspace?.name ?? 'workspace'}</h1><p>Интеграционные секреты задаются только в Vercel Environment Variables и не отправляются из браузера.</p></div></div>
      <div className="tabs settings-tabs">{tabs.map((item) => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>)}</div>
      {tab === 'Threads API' ? <div className="settings-layout"><div><Card className="integration-card"><div className="integration-title"><div><h2>Интеграция Threads</h2><p>Добавьте переменные в Vercel, затем подключите аккаунт на странице «Аккаунты».</p></div><Badge tone={activeAccount ? 'green' : 'orange'}>{activeAccount ? 'OAuth подключён' : 'Нужна настройка'}</Badge></div><label>THREADS_APP_ID<div className="input-action"><input value="Задаётся в Vercel" readOnly /><button onClick={() => void navigator.clipboard.writeText('THREADS_APP_ID')} aria-label="Копировать название переменной"><Copy size={18} /></button></div></label><label>THREADS_APP_SECRET<div className="input-action"><input type={secretVisible ? 'text' : 'password'} value="server-only" readOnly /><button onClick={() => setSecretVisible(!secretVisible)} aria-label={secretVisible ? 'Скрыть значение' : 'Показать значение'}><Eye size={18} /></button></div></label><label>Redirect URI<div className="input-action"><input value="https://threadssmm.vercel.app/api/threads/callback" readOnly /><button onClick={() => void navigator.clipboard.writeText('https://threadssmm.vercel.app/api/threads/callback')} aria-label="Копировать Redirect URI"><Copy size={18} /></button></div></label><div className="integration-actions"><Button onClick={() => navigate('/setup')}><KeyRound size={17} /> Проверить настройку</Button></div></Card><Card><SectionTitle title="Обязательные переменные" /><div className="permission-list"><code>THREADS_APP_ID</code><code>THREADS_APP_SECRET</code><code>THREADS_REDIRECT_URI</code><code>TOKEN_ENCRYPTION_KEY</code><code>CRON_SECRET</code></div></Card></div><div><Card><SectionTitle title="Подключённый профиль" />{activeAccount ? <div className="meta-status"><CheckCircle2 /><div><b>@{activeAccount.username}</b><p>Токен хранится зашифрованно в private schema.</p></div></div> : <p>Официальный аккаунт ещё не подключён.</p>}</Card><Card><SectionTitle title="Лимит Meta" /><p>Threads ограничивает профиль 250 публикациями в сутки и 500 символами на пост. Планировщик автоматически повторяет сбойные публикации (до 3 раз).</p></Card></div></div> : null}
      {tab === 'Голос бренда' && brands.length > 0 ? (
        <Card style={{ maxWidth: 600, margin: '1rem auto' }}>
          <h2 style={{ color: '#fff', marginBottom: '1rem' }}>Голос бренда: {brands[0].name}</h2>
          <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Структурированные настройки тона и стиля для AI-генерации. Сохраняются в поле <code>tone_of_voice</code> бренда.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <label style={{ color: '#aaa', fontSize: '0.85rem' }}>Тон голоса (free-text)</label>
            <input value={brands[0].tone_of_voice} readOnly style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#ccc', width: '100%' }} />
          </div>
          <p style={{ color: '#666', fontSize: '0.8rem', marginTop: '1rem' }}>Подробный редактор (точка зрения, формальность, энергия, юмор, отношение, теплота, стилевые черты) — в `src/components/BrandVoiceEditor.tsx`. Для активации добавьте поле `voice_traits (JSONB)` в таблицу `brands` через миграцию.</p>
        </Card>
      ) : tab === 'Голос бренда' && brands.length === 0 ? <Card><p style={{ color: '#888' }}>Сначала создайте бренд на странице «Бренды».</p></Card> : null}
      <Card className="audit-table table-wrap"><SectionTitle title="Последние события аудита" action={<Button variant="secondary" onClick={exportAudit} disabled={!auditLogs.length}><Download size={16} /> CSV</Button>} />{auditLogs.length ? <table><thead><tr><th>Время</th><th>Кто</th><th>Действие</th><th>Ресурс</th><th>Риск</th></tr></thead><tbody>{auditLogs.map((entry) => <tr key={entry.id}><td>{new Date(entry.created_at).toLocaleString('ru-RU')}</td><td>{entry.actor_id ? entry.actor_id.slice(0, 8) : 'Система'}</td><td>{entry.action}</td><td><code>{entry.resource_type}{entry.resource_id ? `/${entry.resource_id.slice(0, 8)}` : ''}</code></td><td><Badge tone={entry.risk === 'low' ? 'green' : entry.risk === 'medium' ? 'orange' : 'red'}>{entry.risk}</Badge></td></tr>)}</tbody></table> : <div className="empty-state"><h2>Событий пока нет</h2><p>Журнал заполнится после создания workspace, согласований и публикаций.</p></div>}</Card>
    </AppShell>
  )
}


