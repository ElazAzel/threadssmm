import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, BarChart3, Bell, Bot, Check, CheckCircle2, Copy, Download, Eye, FileText, Image as ImageIcon, KeyRound, ShieldCheck, Sparkles, Trash2, Upload } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Badge, Button, Card, Progress, SectionTitle } from '../components/ui'
import { mediaAssets } from '../data'
import { useAuth } from '../contexts/AuthContext'
import { useWorkspace } from '../contexts/WorkspaceContext'

export function AnalyticsPage() {
  const { demo } = useAuth()
  const { workspace, drafts } = useWorkspace()
  const [period, setPeriod] = useState('30Д')
  const [notice, setNotice] = useState('')
  const published = drafts.filter((draft) => draft.status === 'published')
  const bars = demo ? [38, 52, 34, 65, 47, 61, 86] : [0, 0, 0, 0, 0, 0, Math.min(100, published.length * 10)]

  const exportReport = () => {
    const rows = [['Название', 'Статус', 'Запланировано', 'Опубликовано'], ...drafts.map((draft) => [draft.title, draft.status, draft.scheduled_at ?? '', draft.published_at ?? ''])]
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'threads-smm-report.csv'
    anchor.click()
    URL.revokeObjectURL(url)
    setNotice('CSV-отчёт скачан')
    window.setTimeout(() => setNotice(''), 2400)
  }
  return (
    <AppShell title="Обзор аналитики">
      <div className="analytics-toolbar"><div className="segmented">{['7Д', '30Д', '90Д', 'Год'].map((item) => <button key={item} className={period === item ? 'active' : ''} onClick={() => setPeriod(item)}>{item}</button>)}</div><Button variant="secondary" onClick={exportReport}><Download size={17} /> Экспорт CSV</Button></div>
      <div className="metric-grid analytics-metrics"><Card className="metric-card"><span>Всего черновиков <FileText /></span><strong>{demo ? 342 : drafts.length}</strong></Card><Card className="metric-card"><span>Опубликовано <BarChart3 /></span><strong>{demo ? '4.8%' : published.length}</strong></Card><Card className="metric-card"><span>Просмотры <Eye /></span><strong>{demo ? '1.2M' : '—'} <small>{demo ? 'демо' : 'после Meta Insights'}</small></strong></Card><Card className="metric-card"><span>AI-кредиты <Sparkles /></span><strong>{workspace?.ai_credits ?? 0} <small>/200</small></strong><Progress value={Math.min(100, ((workspace?.ai_credits ?? 0) / 200) * 100)} /></Card></div>
      <div className="analytics-layout"><div><Card className="chart-card"><SectionTitle title="Активность публикаций" /><div className="bar-chart">{bars.map((height, index) => <span key={index} className={index === bars.length - 1 ? 'active' : ''} style={{ height: `${Math.max(3, height)}%` }} />)}</div></Card><div className="analytics-lower"><Card><SectionTitle title="Статусы" />{[['Черновики', drafts.filter((draft) => draft.status === 'draft').length], ['Согласование', drafts.filter((draft) => draft.status === 'pending_approval').length], ['Опубликовано', published.length]].map(([label, value]) => <div className="topic-progress" key={label as string}><span>{label}<b>{value}</b></span><Progress value={drafts.length ? ((value as number) / drafts.length) * 100 : 0} /></div>)}</Card><Card><SectionTitle title="Данные Meta" /><p>{demo ? 'В демо показаны примерные графики.' : 'Просмотры и вовлечённость появятся после подключения Threads Insights и первой публикации.'}</p></Card></div></div><Card className="ai-insights"><SectionTitle icon={<Bot />} title="Состояние контента" /><div className="insight-note success"><b>Готово</b><p>{published.length} публикаций отправлено в Threads.</p></div><div className="insight-note danger"><b>Требует внимания</b><p>{drafts.filter((draft) => draft.status === 'failed').length} публикаций завершились ошибкой.</p></div><div className="insight-note next"><b>Следующий шаг</b><p>{drafts.length ? 'Проверьте очередь согласований и расписание.' : 'Создайте первый черновик в AI Studio.'}</p></div></Card></div>
      <Card className="table-wrap"><SectionTitle title="Публикации" />{drafts.length ? <table><thead><tr><th>Публикация</th><th>Формат</th><th>Дата</th><th>Threads ID</th><th>Статус</th></tr></thead><tbody>{drafts.slice(0, 20).map((draft) => <tr key={draft.id}><td><b>{draft.title || 'Без названия'}</b></td><td>{draft.format}</td><td>{new Date(draft.published_at || draft.scheduled_at || draft.created_at).toLocaleString('ru-RU')}</td><td>{draft.threads_post_id || '—'}</td><td><Badge tone={draft.status === 'published' ? 'green' : draft.status === 'failed' ? 'red' : 'blue'}>{draft.status}</Badge></td></tr>)}</tbody></table> : <div className="empty-state"><h2>Данных пока нет</h2><p>Аналитика начнёт заполняться после создания и публикации контента.</p></div>}</Card>
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
  const [brandId, setBrandId] = useState(brands[0]?.id ?? '')
  const fileInput = useRef<HTMLInputElement>(null)
  const asset = assets.find((item) => item.id === selectedId) ?? assets[0] ?? null

  useEffect(() => {
    if (!asset && assets[0]) setSelectedId(assets[0].id)
  }, [asset, assets])

  const handleUpload = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    try {
      const created = await uploadMedia(file, file.name, brandId || null)
      setSelectedId(created.id)
      setNotice('Файл загружен в медиатеку')
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : 'Не удалось загрузить файл')
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ''
      window.setTimeout(() => setNotice(''), 3000)
    }
  }

  const removeAsset = async () => {
    if (!asset) return
    try {
      await deleteMedia(asset)
      setSelectedId(null)
      setNotice('Материал удалён')
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : 'Не удалось удалить материал')
    }
    window.setTimeout(() => setNotice(''), 3000)
  }

  return (
    <AppShell>
      <div className="page-head"><div><h1>Медиатека</h1><p>Изображения хранятся в закрытом Supabase Storage и выдаются по временным ссылкам.</p></div><div className="inline-form"><label className="compact-select">Бренд<select value={brandId} onChange={(event) => setBrandId(event.target.value)}><option value="">Без бренда</option>{brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></label><input ref={fileInput} type="file" accept="image/*" hidden onChange={(event) => void handleUpload(event.target.files?.[0])} /><Button onClick={() => fileInput.current?.click()} disabled={uploading}><Upload size={17} /> {uploading ? 'Загрузка...' : 'Загрузить'}</Button></div></div>
      <div className="media-layout"><div className="media-grid">{assets.map((item, index) => <button key={item.id} className={`media-tile ${asset?.id === item.id ? 'active' : ''} ${index === 0 ? 'media-featured' : ''}`} onClick={() => setSelectedId(item.id)}><img src={item.url} alt={item.title} /><span><Badge tone="blue">{item.source === 'upload' ? 'Файл' : 'AI'}</Badge><b>{item.title}</b><small>{new Date(item.created_at).toLocaleDateString('ru-RU')}</small></span></button>)}{!assets.length ? <Card className="empty-state"><ImageIcon /><h2>Медиатека пуста</h2><p>Загрузите первое изображение до 10 МБ.</p></Card> : null}</div>{asset ? <aside className="asset-details"><h2>Детали материала</h2><img src={asset.url} alt={asset.title} /><h3>{asset.title}</h3><p>{asset.width ?? '—'} × {asset.height ?? '—'} · {(asset.size_bytes / 1024 / 1024).toFixed(2)} МБ · {asset.mime_type}</p><dl><div><dt>Бренд</dt><dd>{brands.find((brand) => brand.id === asset.brand_id)?.name ?? 'Без бренда'}</dd></div><div><dt>Источник</dt><dd>{asset.source}</dd></div><div><dt>Создано</dt><dd>{new Date(asset.created_at).toLocaleDateString('ru-RU')}</dd></div></dl>{asset.prompt ? <Card className="prompt-box"><span>Промпт <button onClick={() => { void navigator.clipboard.writeText(asset.prompt); setCopied(true); window.setTimeout(() => setCopied(false), 2000) }}><Copy size={15} /> {copied ? 'Скопировано' : 'Копировать'}</button></span><p>{asset.prompt}</p></Card> : null}<Button className="full-button" onClick={() => window.open(asset.url, '_blank', 'noopener,noreferrer')}><Download size={17} /> Открыть оригинал</Button><div className="split-actions"><Button variant="secondary" onClick={() => { void navigator.clipboard.writeText(asset.url); setNotice('Временная ссылка скопирована') }}><Copy size={17} /> Ссылка</Button><Button variant="danger" aria-label="Удалить" onClick={() => void removeAsset()}><Trash2 size={17} /></Button></div></aside> : <aside className="asset-details empty-state"><h2>Выберите материал</h2></aside>}</div>
      {notice ? <div className="toast">{notice}</div> : null}
    </AppShell>
  )
}

export function BillingPage() {
  const { workspace, brands, accounts, mediaAssets: assets, monitorSources } = useWorkspace()
  return (
    <AppShell title="Тариф и использование">
      <div className="usage-grid"><Card><span>Осталось AI-кредитов <Sparkles /></span><strong>{workspace?.ai_credits ?? 0} <small>/200</small></strong><Progress value={Math.min(100, ((workspace?.ai_credits ?? 0) / 200) * 100)} /><p>Одна генерация вариантов = 1 кредит</p></Card><Card><span>Профили бренда <Bot /></span><strong className="violet-text">{brands.length}</strong><p>Хранятся в Supabase Postgres</p></Card><Card><span>Медиафайлы <ImageIcon /></span><strong className="orange-text">{assets.length}</strong><p>Закрытый Supabase Storage</p></Card></div>
      <Card className="current-plan"><div><span className="mono-label">Текущая конфигурация</span><h2>Free MVP <Badge tone="green">Без оплаты</Badge></h2><p>Vercel Hobby + Supabase Free + Gemini Free Tier + официальный Threads API</p></div></Card>
      <h2 className="standalone-title">Подключённые бесплатные сервисы</h2><div className="plans-grid"><Card><Badge tone="blue">Frontend/API</Badge><h2>Vercel Hobby</h2><p>Хостинг SPA, serverless endpoints и один ежедневный cron.</p><ul><li><Check size={17} /> GitHub автодеплой</li><li><Check size={17} /> HTTPS</li><li><Check size={17} /> Serverless Functions</li></ul></Card><Card><Badge tone="blue">Данные</Badge><h2>Supabase Free</h2><p>{brands.length} брендов · {accounts.length} аккаунтов · {monitorSources.length} RSS-источников</p><ul><li><Check size={17} /> Auth и RLS</li><li><Check size={17} /> Postgres</li><li><Check size={17} /> Private Storage</li></ul></Card><Card><Badge tone="blue">AI и публикация</Badge><h2>Gemini + Meta</h2><p>Оплата в приложении не подключена. Используются только доступные бесплатные квоты внешних сервисов.</p><ul><li><Check size={17} /> Gemini Flash</li><li><Check size={17} /> Threads OAuth</li><li><Check size={17} /> Ручной fallback</li></ul></Card></div>
    </AppShell>
  )
}

export function SettingsPage() {
  const { workspace, accounts, auditLogs } = useWorkspace()
  const navigate = useNavigate()
  const activeAccount = accounts.find((account) => account.status === 'active')
  const [tab, setTab] = useState(() => window.matchMedia('(max-width: 720px)').matches ? 'Workspace' : 'Threads API')
  const [secretVisible, setSecretVisible] = useState(false)
  const tabs = ['Workspace', 'Безопасность', 'AI-провайдеры', 'Threads API', 'Уведомления', 'Аудит']
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
      <div className="page-head"><div><h1>Настройки {workspace?.name ?? 'workspace'}</h1><p>Интеграционные секреты задаются только в Vercel Environment Variables и не отправляются из браузера.</p></div></div><div className="tabs settings-tabs">{tabs.map((item) => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>)}</div>
      {tab === 'Threads API' ? <div className="settings-layout"><div><Card className="integration-card"><div className="integration-title"><div><h2>Интеграция Threads</h2><p>Добавьте переменные в Vercel, затем подключите аккаунт на странице «Аккаунты».</p></div><Badge tone={activeAccount ? 'green' : 'orange'}>{activeAccount ? 'OAuth подключён' : 'Нужна настройка'}</Badge></div><label>THREADS_APP_ID<div className="input-action"><input value="Задаётся в Vercel" readOnly /><button onClick={() => void navigator.clipboard.writeText('THREADS_APP_ID')} aria-label="Копировать название переменной"><Copy size={18} /></button></div></label><label>THREADS_APP_SECRET<div className="input-action"><input type={secretVisible ? 'text' : 'password'} value="server-only" readOnly /><button onClick={() => setSecretVisible(!secretVisible)} aria-label={secretVisible ? 'Скрыть значение' : 'Показать значение'}><Eye size={18} /></button></div></label><label>Redirect URI<div className="input-action"><input value="https://threadssmm.vercel.app/api/threads/callback" readOnly /><button onClick={() => void navigator.clipboard.writeText('https://threadssmm.vercel.app/api/threads/callback')} aria-label="Копировать Redirect URI"><Copy size={18} /></button></div></label><div className="integration-actions"><Button onClick={() => navigate('/setup')}><KeyRound size={17} /> Проверить настройку</Button></div></Card><Card><SectionTitle title="Обязательные переменные" /><div className="permission-list"><code>THREADS_APP_ID</code><code>THREADS_APP_SECRET</code><code>THREADS_REDIRECT_URI</code><code>TOKEN_ENCRYPTION_KEY</code><code>CRON_SECRET</code></div></Card></div><div><Card><SectionTitle title="Подключённый профиль" />{activeAccount ? <div className="meta-status"><CheckCircle2 /><div><b>@{activeAccount.username}</b><p>Токен хранится зашифрованно в private schema.</p></div></div> : <p>Официальный аккаунт ещё не подключён.</p>}</Card><Card><SectionTitle title="Лимит Meta" /><p>Threads ограничивает профиль до 250 публикаций за 24 часа. Приложение не обходит это ограничение.</p></Card></div></div> : <SettingsTab tab={tab} />}
      <Card className="audit-table table-wrap"><SectionTitle title="Последние события аудита" action={<Button variant="secondary" onClick={exportAudit} disabled={!auditLogs.length}><Download size={16} /> CSV</Button>} />{auditLogs.length ? <table><thead><tr><th>Время</th><th>Кто</th><th>Действие</th><th>Ресурс</th><th>Риск</th></tr></thead><tbody>{auditLogs.map((entry) => <tr key={entry.id}><td>{new Date(entry.created_at).toLocaleString('ru-RU')}</td><td>{entry.actor_id ? entry.actor_id.slice(0, 8) : 'Система'}</td><td>{entry.action}</td><td><code>{entry.resource_type}{entry.resource_id ? `/${entry.resource_id.slice(0, 8)}` : ''}</code></td><td><Badge tone={entry.risk === 'low' ? 'green' : entry.risk === 'medium' ? 'orange' : 'red'}>{entry.risk}</Badge></td></tr>)}</tbody></table> : <div className="empty-state"><h2>Событий пока нет</h2><p>Журнал заполнится после создания workspace, согласований и публикаций.</p></div>}</Card>
    </AppShell>
  )
}

function SettingsTab({ tab }: { tab: string }) {
  const { workspace, workspaceSettings, updateWorkspace, saveWorkspaceSettings } = useWorkspace()
  const [name, setName] = useState(workspace?.name ?? '')
  const [timezone, setTimezone] = useState(workspace?.timezone ?? 'UTC')
  const [notice, setNotice] = useState('')
  const settingsKey = tab === 'Безопасность' ? 'security' : tab === 'AI-провайдеры' ? 'ai' : tab === 'Уведомления' ? 'notifications' : 'audit'
  const enabledKey = `${settingsKey}_enabled` as const
  const policyKey = `${settingsKey}_policy` as const
  const [enabled, setEnabled] = useState(workspaceSettings?.[enabledKey] ?? true)
  const [policy, setPolicy] = useState(workspaceSettings?.[policyKey] ?? 'standard')

  useEffect(() => {
    setName(workspace?.name ?? '')
    setTimezone(workspace?.timezone ?? 'UTC')
  }, [workspace])

  useEffect(() => {
    setEnabled(workspaceSettings?.[enabledKey] ?? true)
    setPolicy(workspaceSettings?.[policyKey] ?? 'standard')
  }, [enabledKey, policyKey, workspaceSettings])

  const saveWorkspace = async () => {
    try {
      await updateWorkspace({ name, timezone })
      setNotice('Настройки workspace сохранены')
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : 'Не удалось сохранить настройки')
    }
    window.setTimeout(() => setNotice(''), 2500)
  }

  const saveSection = async () => {
    try {
      await saveWorkspaceSettings({ [enabledKey]: enabled, [policyKey]: policy })
      setNotice('Настройки сохранены')
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : 'Не удалось сохранить настройки')
    }
    window.setTimeout(() => setNotice(''), 2500)
  }

  if (tab === 'Workspace') {
    return <div className="mobile-workspace-settings"><Card className="general-info"><h2>Основные данные</h2><label>Название workspace<input value={name} onChange={(event) => setName(event.target.value)} /></label><label>Часовой пояс<input value={timezone} onChange={(event) => setTimezone(event.target.value)} placeholder="Asia/Qyzylorda" /></label><div><button className="text-button" onClick={() => { setName(workspace?.name ?? ''); setTimezone(workspace?.timezone ?? 'UTC') }}>Отменить изменения</button><Button onClick={() => void saveWorkspace()} disabled={!name.trim()}>Сохранить</Button></div></Card><Card><SectionTitle title="Хранение данных" /><p>Workspace, бренды, черновики и права доступа защищены Supabase RLS.</p></Card>{notice ? <div className="toast">{notice}</div> : null}</div>
  }
  const blocks: Record<string, { icon: typeof ShieldCheck; title: string; text: string }> = {
    'Безопасность': { icon: ShieldCheck, title: 'Политики безопасности', text: 'Сессии, двухфакторная аутентификация, журнал действий и ротация ключей.' },
    'AI-провайдеры': { icon: Bot, title: 'AI-провайдеры', text: 'Модели по умолчанию, лимиты стоимости и зашифрованные пользовательские ключи.' },
    'Уведомления': { icon: Bell, title: 'Уведомления', text: 'Согласования, ошибки публикации, лимиты кредитов и критические риски.' },
    'Аудит': { icon: AlertTriangle, title: 'Аудит и compliance', text: 'Период хранения событий, экспорт и правила высокого риска.' },
  }
  const item = blocks[tab]
  const Icon = item.icon
  return <><Card className="settings-placeholder"><Icon /><div><h2>{item.title}</h2><p>{item.text}</p><label className="switch-row"><span>Включить рекомендуемые настройки</span><input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} /></label><label>Основная политика<select value={policy} onChange={(event) => setPolicy(event.target.value as typeof policy)}><option value="standard">Стандартная</option><option value="strict">Строгая</option><option value="custom">Пользовательская</option></select></label><Button onClick={() => void saveSection()}>Сохранить</Button></div></Card>{notice ? <div className="toast">{notice}</div> : null}</>
}
