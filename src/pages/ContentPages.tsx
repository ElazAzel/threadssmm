import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Bot, Check, CircleAlert, Copy, ExternalLink, Globe2, History, Link2, Plus, RefreshCw, Save, SlidersHorizontal, Sparkles, Trash2, Upload } from 'lucide-react'
import { AppShell } from '../components/AppShell'
import { Badge, Button, Card, Modal, Progress, SectionTitle } from '../components/ui'
import { variants } from '../data'
import { useAuth } from '../contexts/AuthContext'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { authenticatedJson } from '../lib/api'
import type { Brand, ContentFormat } from '../lib/domain'

interface AiVariantResponse {
  id: 'A' | 'B' | 'C'
  tone: string
  text: string
  hookScore: number
  complianceScore: number
  complianceNote: string
}

export function AccountsPage() {
  const { getAccessToken } = useAuth()
  const { workspace, accounts: workspaceAccounts, brands, addManualAccount, updateAccount, deleteAccount, refresh } = useWorkspace()
  const [searchParams] = useSearchParams()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [username, setUsername] = useState('')
  const [saving, setSaving] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [removeOpen, setRemoveOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const account = workspaceAccounts.find((item) => item.id === selectedId) ?? workspaceAccounts[0] ?? null

  const addAccount = async () => {
    setSaving(true)
    try {
      const created = await addManualAccount(username, brands[0]?.id)
      setSelectedId(created.id)
      setUsername('')
      setAddOpen(false)
      setNotice('Профиль добавлен. Для автопубликации подключите Meta OAuth в настройках сервера.')
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : 'Не удалось добавить профиль')
    } finally {
      setSaving(false)
      window.setTimeout(() => setNotice(''), 3200)
    }
  }

  const status = (value: typeof workspaceAccounts[number]['status']) => ({ active: ['Активен', 'green'], pending: ['Подключение', 'orange'], expired: ['Токен истёк', 'red'], error: ['Ошибка', 'red'], manual: ['Ручной режим', 'neutral'] } as const)[value]

  useEffect(() => {
    const connected = searchParams.get('threads')
    const oauthError = searchParams.get('threads_error')
    if (connected === 'connected') {
      setNotice('Threads-аккаунт подключён')
      void refresh()
    } else if (oauthError) setNotice(oauthError)
  }, [refresh, searchParams])

  const connectThreads = async () => {
    if (!workspace) return
    setConnecting(true)
    try {
      const payload = await authenticatedJson<{ url?: string }>(getAccessToken, '/api/threads/connect', { workspaceId: workspace.id })
      if (!payload.url) throw new Error('Сервер не вернул ссылку Meta OAuth')
      window.location.assign(payload.url)
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : 'Не удалось подключить Threads')
      setConnecting(false)
      window.setTimeout(() => setNotice(''), 3500)
    }
  }

  const assignBrand = async (brandId: string) => {
    if (!account) return
    try {
      await updateAccount(account.id, { brand_id: brandId || null })
      setNotice('Бренд аккаунта обновлён')
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : 'Не удалось обновить аккаунт')
    }
    window.setTimeout(() => setNotice(''), 2500)
  }

  const removeAccount = async () => {
    if (!account) return
    try {
      await deleteAccount(account.id)
      setSelectedId(null)
      setRemoveOpen(false)
      setNotice('Профиль удалён')
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : 'Не удалось удалить профиль')
    }
    window.setTimeout(() => setNotice(''), 2500)
  }

  return (
    <AppShell>
      <div className="page-head"><div><h1>Подключённые аккаунты</h1><p>Официальный OAuth для публикации и ручной профиль как безопасный fallback без паролей и cookies.</p></div><div className="inline-form"><Button variant="secondary" onClick={() => setAddOpen(true)}><Plus size={18} /> Ручной профиль</Button><Button onClick={() => void connectThreads()} disabled={connecting}><Link2 size={18} /> {connecting ? 'Открываем Meta...' : 'Подключить Threads'}</Button></div></div>
      <Card className="api-notice"><CircleAlert /><div><h3>Ограничения официального API</h3><p>Некоторые действия недоступны через Threads API. Используйте безопасный fallback: создайте черновик, скопируйте текст или откройте Threads вручную.</p></div></Card>
      <div className="mobile-account-list"><Button onClick={() => setAddOpen(true)}><Link2 size={18} /> Добавить новый профиль</Button>{workspaceAccounts.map((item) => { const state = status(item.status); return <Card key={item.id} onClick={() => setSelectedId(item.id)}><div><span className="account-avatar">{item.username.slice(0, 1).toUpperCase()}</span><span><b>@{item.username}</b><small>{brands.find((brand) => brand.id === item.brand_id)?.name ?? 'Без бренда'}</small></span><Badge tone={state[1]}>{state[0]}</Badge></div><footer><span>{item.status === 'active' ? 'Официальный API подключён' : 'Ручное копирование и публикация'}</span><b>›</b></footer></Card> })}</div>
      <div className="accounts-layout">
        <Card className="accounts-table">
          <SectionTitle title="Профили" action={<button className="icon-button" aria-label="Обновить" onClick={() => void refresh()}><RefreshCw size={18} /></button>} />
          {workspaceAccounts.length ? <div className="table-wrap"><table><thead><tr><th>Аккаунт</th><th>Бренд</th><th>Статус</th><th /></tr></thead><tbody>{workspaceAccounts.map((item) => { const state = status(item.status); return <tr key={item.id} className={account?.id === item.id ? 'selected-row' : ''} onClick={() => setSelectedId(item.id)}><td><span className="account-avatar">{item.username.slice(0, 1).toUpperCase()}</span><b>@{item.username}<small>ID: {item.threads_user_id ?? 'не подключён'}</small></b></td><td>{brands.find((brand) => brand.id === item.brand_id)?.name ?? 'Без бренда'}</td><td><Badge tone={state[1]}>{state[0]}</Badge></td><td>•••</td></tr> })}</tbody></table></div> : <div className="empty-state"><h2>Профилей пока нет</h2><p>Добавьте username, чтобы сохранять контент для нужного Threads-аккаунта.</p></div>}
        </Card>
        {account ? <Card className="account-detail">
          <div className="account-hero"><span className="account-avatar large">{account.username.slice(0, 1).toUpperCase()}</span><div><h2>@{account.username}</h2><p>ID: {account.threads_user_id ?? 'ожидает OAuth'}</p></div></div>
          <h3 className="mono-label">Статус подключения</h3><div className="status-box"><Check size={18} /><b>{account.status === 'active' ? 'Официальный API подключён' : 'Ручной режим'}</b><span>{account.status === 'active' ? 'Токен активен' : 'Без доступа к паролю и cookies'}</span></div>
          <h3 className="mono-label">Разрешения</h3><div className="permission-list">{account.permissions.length ? account.permissions.map((permission) => <code key={permission}>{permission}</code>) : <code>не выданы</code>}</div>
          <label>Связанный бренд<select value={account.brand_id ?? ''} onChange={(event) => void assignBrand(event.target.value)}><option value="">Без бренда</option>{brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></label>
          <h3 className="mono-label">Готовность API <span>{account.status === 'active' ? '100%' : '0%'}</span></h3><Progress value={account.status === 'active' ? 100 : 0} /><p className="centered-note">{account.last_error || 'Ручное сохранение контента доступно всегда.'}</p>
          <div className="split-actions"><Button variant="danger" onClick={() => setRemoveOpen(true)}><Trash2 size={17} /> Удалить</Button><Button variant="secondary" onClick={() => void refresh()}><RefreshCw size={17} /> Обновить</Button><Button variant="secondary" onClick={() => window.open(`https://www.threads.net/@${account.username}`, '_blank', 'noopener,noreferrer')}><ExternalLink size={17} /> Открыть Threads</Button></div>
        </Card> : <Card className="account-detail empty-state"><h2>Выберите профиль</h2><p>Здесь появятся статус OAuth и разрешения официального API.</p></Card>}
      </div>
      {addOpen ? <Modal title="Добавить Threads-профиль" onClose={() => setAddOpen(false)}><div className="form-stack"><label>Username<input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="@brand_name" autoFocus /></label><p className="centered-note">Профиль добавится в ручном режиме. Это рабочий fallback без передачи пароля.</p><div className="modal-actions"><Button variant="secondary" onClick={() => setAddOpen(false)}>Отмена</Button><Button onClick={() => void addAccount()} disabled={!username.trim() || saving}>{saving ? 'Добавляем...' : 'Добавить'}</Button></div></div></Modal> : null}
      {removeOpen && account ? <Modal title="Удалить профиль" onClose={() => setRemoveOpen(false)}><p>Профиль @{account.username} и связанный OAuth-токен будут удалены. Черновики сохранятся без привязки к аккаунту.</p><div className="modal-actions"><Button variant="secondary" onClick={() => setRemoveOpen(false)}>Отмена</Button><Button variant="danger" onClick={() => void removeAccount()}>Удалить</Button></div></Modal> : null}
      {notice ? <div className="toast">{notice}</div> : null}
    </AppShell>
  )
}

export function BrandsPage() {
  const { brands, createBrand, saveBrand } = useWorkspace()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editing, setEditing] = useState<Brand | null>(brands[0] ?? null)
  const [tab, setTab] = useState('Обзор')
  const [saved, setSaved] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [newBrandName, setNewBrandName] = useState('')
  const [saving, setSaving] = useState(false)
  const tabs = ['Обзор', 'Голос и тон', 'Аудитория', 'Правила', 'Контент-пиллары']

  useEffect(() => {
    const next = brands.find((item) => item.id === selectedId) ?? brands[0] ?? null
    setEditing(next)
    if (next && !selectedId) setSelectedId(next.id)
  }, [brands, selectedId])

  const update = <K extends keyof Brand>(field: K, value: Brand[K]) => setEditing((current) => current ? { ...current, [field]: value } : current)

  const persist = async () => {
    if (!editing) return
    setSaving(true)
    try {
      await saveBrand(editing)
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  const addBrand = async () => {
    if (!newBrandName.trim()) return
    setSaving(true)
    try {
      const created = await createBrand(newBrandName)
      setSelectedId(created.id)
      setNewBrandName('')
      setCreateOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell>
      <div className="brand-editor">
        <aside className="profile-rail"><div className="rail-title"><h2>Профили бренда</h2><button aria-label="Добавить бренд" onClick={() => setCreateOpen(true)}><Plus size={19} /></button></div>{brands.map((item) => <button key={item.id} className={selectedId === item.id ? 'active' : ''} onClick={() => setSelectedId(item.id)}><b>{item.name}</b><span>{item.niche || 'Ниша не указана'}</span></button>)}</aside>
        <section className="profile-main">
          {editing ? <><div className="profile-head"><div className="brand-symbol"><Bot /></div><div><h1>{editing.name}</h1><p><Badge>{editing.niche || 'Профиль'}</Badge> Контекст для AI Studio</p></div><div className="profile-actions"><Button onClick={() => void persist()} disabled={saving}><Save size={17} /> {saving ? 'Сохраняем...' : 'Сохранить'}</Button></div></div>
          <div className="tabs">{tabs.map((item) => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>)}</div>
          {tab === 'Обзор' ? <div className="profile-overview"><Card className="identity-card"><SectionTitle icon={<Globe2 />} title="Основа бренда" /><div className="form-grid"><label>Название<input value={editing.name} onChange={(event) => update('name', event.target.value)} /></label><label>Ниша<input value={editing.niche} onChange={(event) => update('niche', event.target.value)} /></label><label>Продукт<input value={editing.product} onChange={(event) => update('product', event.target.value)} /></label><label>Сайт<input value={editing.website ?? ''} onChange={(event) => update('website', event.target.value || null)} placeholder="https://" /></label><label className="full">Позиционирование<textarea rows={3} value={editing.positioning} onChange={(event) => update('positioning', event.target.value)} /></label><label className="full">Ценностное предложение<textarea rows={3} value={editing.usp} onChange={(event) => update('usp', event.target.value)} /></label></div></Card><Card className="goal-card"><SectionTitle title="Главные цели" /><label>По одной цели в строке<textarea rows={8} value={editing.goals.join('\n')} onChange={(event) => update('goals', lines(event.target.value))} /></label></Card></div> : <BrandTabEditor tab={tab} brand={editing} update={update} />}</> : <Card className="empty-state"><h2>Профиль бренда не создан</h2><p>Добавьте бренд, чтобы AI учитывал аудиторию, тон и ограничения.</p><Button onClick={() => setCreateOpen(true)}><Plus size={17} /> Добавить бренд</Button></Card>}
        </section>
      </div>
      {createOpen ? <Modal title="Новый профиль бренда" onClose={() => setCreateOpen(false)}><div className="form-stack"><label>Название<input value={newBrandName} onChange={(event) => setNewBrandName(event.target.value)} autoFocus /></label><div className="modal-actions"><Button variant="secondary" onClick={() => setCreateOpen(false)}>Отмена</Button><Button onClick={() => void addBrand()} disabled={!newBrandName.trim() || saving}>Создать</Button></div></div></Modal> : null}
      {saved ? <div className="toast">Профиль бренда сохранён</div> : null}
    </AppShell>
  )
}

function lines(value: string) {
  return value.split('\n').map((item) => item.trim()).filter(Boolean)
}

function BrandTabEditor({ tab, brand, update }: { tab: string; brand: Brand; update: <K extends keyof Brand>(field: K, value: Brand[K]) => void }) {
  if (tab === 'Голос и тон') return <Card className="single-tab-card"><h2>Голос бренда</h2><label>Тон<textarea rows={6} value={brand.tone_of_voice} onChange={(event) => update('tone_of_voice', event.target.value)} /></label><label>Стиль ответов<textarea rows={5} value={brand.reply_style} onChange={(event) => update('reply_style', event.target.value)} /></label></Card>
  if (tab === 'Аудитория') return <Card className="single-tab-card"><h2>Целевая аудитория</h2><label>Описание<textarea rows={6} value={brand.audience} onChange={(event) => update('audience', event.target.value)} /></label><label>Идеальный клиент<textarea rows={5} value={brand.icp} onChange={(event) => update('icp', event.target.value)} /></label><label>География<input value={brand.geography} onChange={(event) => update('geography', event.target.value)} /></label></Card>
  if (tab === 'Правила') return <Card className="single-tab-card"><h2>Правила и ограничения</h2><label>Запрещённые темы<textarea rows={6} value={brand.forbidden_topics.join('\n')} onChange={(event) => update('forbidden_topics', lines(event.target.value))} /></label><label>Работа с негативом<textarea rows={5} value={brand.negative_response_rules} onChange={(event) => update('negative_response_rules', event.target.value)} /></label><label>Допустимый риск: {brand.risk_tolerance}%<input type="range" min="0" max="100" value={brand.risk_tolerance} onChange={(event) => update('risk_tolerance', Number(event.target.value))} /></label></Card>
  return <Card className="single-tab-card"><h2>Контент-пиллары</h2><label>По одной теме в строке<textarea rows={7} value={brand.content_pillars.join('\n')} onChange={(event) => update('content_pillars', lines(event.target.value))} /></label><label>Призывы к действию<textarea rows={5} value={brand.ctas.join('\n')} onChange={(event) => update('ctas', lines(event.target.value))} /></label></Card>
}

export function StudioPage() {
  const { demo, getAccessToken } = useAuth()
  const { workspace, drafts, createQuickDraft, requestApproval, refresh } = useWorkspace()
  const [type, setType] = useState('Пост')
  const [prompt, setPrompt] = useState('')
  const [generated, setGenerated] = useState(demo)
  const [currentVariants, setCurrentVariants] = useState(variants)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState('B')
  const [notice, setNotice] = useState('')
  const [tone, setTone] = useState('Профессиональный')
  const [audienceGoal, setAudienceGoal] = useState('Получить содержательные ответы')
  const [riskTolerance, setRiskTolerance] = useState(45)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [visualType, setVisualType] = useState('3D-концепт')
  const navigate = useNavigate()

  const contentFormat = ({ Пост: 'post', Тред: 'thread', Ответ: 'reply' } as const)[type as 'Пост' | 'Тред' | 'Ответ'] ?? 'post'

  const generate = async () => {
    if (!prompt.trim() || !workspace) return
    setLoading(true)
    setNotice('')
    if (demo) {
      window.setTimeout(() => { setGenerated(true); setLoading(false); setNotice('Созданы 3 варианта в голосе бренда'); window.setTimeout(() => setNotice(''), 2500) }, 700)
      return
    }

    try {
      const generationPrompt = `${prompt.trim()}\nТон: ${tone}. Цель аудитории: ${audienceGoal}.`
      const payload = await authenticatedJson<{ variants?: AiVariantResponse[] }>(getAccessToken, '/api/ai/generate', { workspaceId: workspace.id, prompt: generationPrompt, format: contentFormat, riskTolerance })
      if (!payload.variants) throw new Error('AI не вернул варианты')
      setCurrentVariants(payload.variants.map((item) => ({
        id: item.id,
        tone: item.tone,
        badge: item.complianceScore < 70 ? 'orange' as const : item.id === 'B' ? 'violet' as const : 'blue' as const,
        score: item.hookScore.toFixed(1),
        compliance: `${item.complianceScore}% · ${item.complianceNote}`,
        text: item.text,
      })))
      setSelected(payload.variants[0].id)
      setGenerated(true)
      setNotice('Созданы 3 варианта в голосе бренда')
      await refresh()
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : 'AI-генерация временно недоступна')
    } finally {
      setLoading(false)
      window.setTimeout(() => setNotice(''), 3200)
    }
  }

  const saveVariant = async (variantId: string, approve: boolean) => {
    const variant = currentVariants.find((item) => item.id === variantId)
    if (!variant) return
    setSelected(variantId)
    try {
      const draft = await createQuickDraft(variant.text, contentFormat as ContentFormat, 'ai_studio')
      if (approve) await requestApproval(draft.id, `AI Studio, вариант ${variantId}`)
      setNotice(approve ? `Вариант ${variantId} отправлен на согласование` : `Вариант ${variantId} сохранён в черновики`)
      if (approve) window.setTimeout(() => navigate('/app/approvals'), 500)
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : 'Не удалось сохранить вариант')
    }
  }

  return (
    <AppShell>
      <div className="studio-layout">
        <div className="mobile-studio-intro"><h1>AI Studio</h1><p>Настройте и создайте несколько сильных вариантов контента.</p></div>
        <Card className="mobile-studio-config"><SectionTitle title="Настройки генерации" /><span className="field-label">Тон</span><div className="tone-options">{['Профессиональный', 'Вовлекающий', 'Экспертный'].map((item) => <button key={item} className={tone === item ? 'active' : ''} onClick={() => setTone(item)}>{item}</button>)}</div><div className="form-grid"><label>Длина<select><option>Короткий пост</option><option>Средний пост</option></select></label><label>Хэштеги<select><option>Минимально (1–2)</option><option>Без хэштегов</option></select></label></div></Card>
        <div className="studio-config">
          <Card><SectionTitle icon={<SlidersHorizontal />} title="Настройки генерации" /><label>Workspace<select><option>{workspace?.name ?? 'Workspace'}</option></select></label><label>Персона бренда<select><option>Профиль бренда</option></select></label><div className="form-grid compact"><label>Язык<select><option>Русский</option></select></label><label>Модель<select><option>Gemini Flash</option></select></label></div><span className="field-label">Формат</span><div className="segmented full">{['Пост', 'Тред', 'Ответ'].map((item) => <button key={item} className={type === item ? 'active' : ''} onClick={() => setType(item)}>{item}</button>)}</div><span className="field-label">Тон</span><div className="segmented full">{['Профессиональный', 'Вовлекающий', 'Экспертный'].map((item) => <button key={item} className={tone === item ? 'active' : ''} onClick={() => setTone(item)}>{item}</button>)}</div><span className="field-label">Допустимый риск: {riskTolerance}%</span><input type="range" min="0" max="100" value={riskTolerance} onChange={(event) => setRiskTolerance(Number(event.target.value))} /><div className="range-labels"><span>Безопасно</span><span>Смело</span></div></Card>
          <Card><SectionTitle icon={<Bot />} title="Контекст" /><label>Основная мысль<textarea rows={9} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Например: объяснить, почему системный контент сильнее случайных вирусных постов" /></label><label>Цель аудитории<input value={audienceGoal} onChange={(event) => setAudienceGoal(event.target.value)} placeholder="Получить ответы и переходы" /></label><Button className="full-button" onClick={() => void generate()} disabled={loading || prompt.trim().length < 5}><Sparkles size={18} /> {loading ? 'Генерируем...' : 'Создать варианты'}</Button></Card>
        </div>

        <section className="studio-results"><div className="page-head compact-head"><div><h1>Варианты публикации</h1><p>Проверьте смысл, риски и голос бренда перед согласованием.</p></div><Button variant="secondary" onClick={() => setHistoryOpen(true)}><History size={17} /> История</Button></div>
          {generated ? <div className="variant-grid">{currentVariants.map((item) => <Card key={item.id} className={`variant-card ${selected === item.id ? 'selected' : ''}`} onClick={() => setSelected(item.id)}><div className="variant-top"><Badge>Вариант {item.id}</Badge><Badge tone={item.badge}>{item.tone}</Badge><button aria-label="Скопировать" onClick={(event) => { event.stopPropagation(); void navigator.clipboard.writeText(item.text); setNotice('Текст скопирован') }}><Copy size={17} /></button></div><p className="variant-copy">{item.text}</p><div className="variant-scores"><span><small>Hook score</small><b>{item.score}</b></span><span><small>Compliance</small><b>{item.compliance}</b></span></div><div className="split-actions"><Button variant="secondary" onClick={(event) => { event.stopPropagation(); void saveVariant(item.id, false) }}>Сохранить</Button><Button onClick={(event) => { event.stopPropagation(); void saveVariant(item.id, true) }}>Согласовать</Button></div></Card>)}</div> : <Card className="empty-state"><h2>Варианты ещё не созданы</h2><p>Опишите основную мысль и запустите генерацию. Результат появится здесь.</p></Card>}
          <Card className="visual-assets"><div><SectionTitle title="Визуальные материалы" /><label>Визуальный стиль<select><option>Technical Dark</option><option>Editorial Minimal</option><option>Brand Gradient</option></select></label><p>Выбрано: {visualType}. Используйте тип как основу промпта или загрузите готовое изображение.</p></div><div className="visual-options">{[['{ }', 'Абстракция'], ['◒', '3D-концепт'], ['⌘', 'Интерфейс']].map(([icon, item]) => <button key={item} className={visualType === item ? 'active' : ''} onClick={() => { setVisualType(item); void navigator.clipboard.writeText(`${item}, ${prompt || 'визуал для Threads'}, стиль бренда`); setNotice(`Промпт «${item}» скопирован`) }}>{icon}<span>{item}</span></button>)}<button onClick={() => navigate('/app/media')}><Upload /><span>Загрузить</span></button></div></Card>
        </section>
      </div>
      {historyOpen ? <Modal title="История AI Studio" onClose={() => setHistoryOpen(false)}><div className="history-list">{drafts.filter((draft) => draft.source === 'ai_studio').slice(0, 10).map((draft) => <button key={draft.id} onClick={() => { setPrompt(draft.content); setHistoryOpen(false) }}><b>{draft.title || 'Без названия'}</b><small>{new Date(draft.created_at).toLocaleString('ru-RU')} · {draft.status}</small></button>)}{!drafts.some((draft) => draft.source === 'ai_studio') ? <div className="empty-state compact"><h3>История пока пуста</h3><p>Сохранённые варианты появятся здесь.</p></div> : null}</div></Modal> : null}
      {notice ? <div className="toast">{notice}</div> : null}
    </AppShell>
  )
}
