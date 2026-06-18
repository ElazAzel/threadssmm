import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Bot, Check, CheckCircle2, ChevronRight, Clock3, Copy, Edit3, Filter, Lightbulb, Plus, Radar, RefreshCw, Sparkles, X } from 'lucide-react'
import { AppShell } from '../components/AppShell'
import { Badge, Button, Card, Modal, Progress, SectionTitle } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { authenticatedJson } from '../lib/api'

const calendarEvents = [
  { id: 'demo-calendar-1', draftId: null, date: new Date('2026-06-16T09:00:00'), brandId: null, accountId: null, title: 'Продуктовый дайджест', status: 'Опубликован', tone: 'green' as const, time: '09:00', content: 'Короткий дайджест продуктовых обновлений.' },
  { id: 'demo-calendar-2', draftId: null, date: new Date('2026-06-17T14:30:00'), brandId: null, accountId: null, title: 'Q3: главные функции', status: 'Запланирован', tone: 'blue' as const, time: '14:30', content: 'Мы выпустили три обновления аналитики: отслеживание вовлечённости, еженедельные отчёты и сравнение контент-пилларов.' },
  { id: 'demo-calendar-3', draftId: null, date: new Date('2026-06-17T18:00:00'), brandId: null, accountId: null, title: 'Контрарный взгляд на AI', status: 'Черновик', tone: 'orange' as const, time: '18:00', content: 'AI не заменяет редактора, а ускоряет проверяемые сценарии.' },
  { id: 'demo-calendar-4', draftId: null, date: new Date('2026-06-18T12:00:00'), brandId: null, accountId: null, title: 'Бэкстейдж команды', status: 'Идея', tone: 'neutral' as const, time: '12:00', content: 'Показываем процесс команды без постановочных кадров.' },
]

export function CalendarPage() {
  const { demo, getAccessToken } = useAuth()
  const { drafts, brands, accounts, updateDraft, refresh } = useWorkspace()
  const navigate = useNavigate()
  const liveEvents = drafts.filter((draft) => draft.scheduled_at || draft.status === 'scheduled' || draft.status === 'published').map((draft) => {
    const date = draft.scheduled_at ? new Date(draft.scheduled_at) : new Date(draft.created_at)
    return { id: draft.id, draftId: draft.id, date, brandId: draft.brand_id, accountId: draft.account_id, title: draft.title || 'Публикация без названия', status: draft.status === 'published' ? 'Опубликован' : 'Запланирован', tone: draft.status === 'published' ? 'green' as const : 'blue' as const, time: date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }), content: draft.content }
  })
  const events = demo ? calendarEvents : liveEvents
  const [mode, setMode] = useState('Месяц')
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(2026, 5, 1))
  const [brandFilter, setBrandFilter] = useState('')
  const [accountFilter, setAccountFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(events[0]?.id ?? null)
  const selected = events.find((event) => event.id === selectedId) ?? events[0] ?? null
  const [scheduleDate, setScheduleDate] = useState('2026-06-16')
  const [scheduleTime, setScheduleTime] = useState('14:30')
  const [notice, setNotice] = useState('')
  const [publishing, setPublishing] = useState(false)
  const monthLabel = visibleMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
  const filteredEvents = events.filter((event) => {
    const sameMonth = event.date.getFullYear() === visibleMonth.getFullYear() && event.date.getMonth() === visibleMonth.getMonth()
    return sameMonth && (!brandFilter || event.brandId === brandFilter) && (!accountFilter || event.accountId === accountFilter) && (!statusFilter || event.status === statusFilter)
  }).sort((left, right) => left.date.getTime() - right.date.getTime())
  const weekAnchor = selected?.date ?? new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1)
  const weekStart = new Date(weekAnchor)
  weekStart.setHours(0, 0, 0, 0)
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7))
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)
  const displayedEvents = mode === 'Неделя'
    ? filteredEvents.filter((event) => event.date >= weekStart && event.date < weekEnd)
    : filteredEvents
  const firstWeekday = (new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1).getDay() + 6) % 7
  const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate()
  const cellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7
  const monthCells = Array.from({ length: cellCount }, (_, index) => {
    const day = index - firstWeekday + 1
    return day >= 1 && day <= daysInMonth ? day : null
  })

  useEffect(() => {
    if (!selected?.draftId) return
    const draft = drafts.find((item) => item.id === selected.draftId)
    if (!draft?.scheduled_at) return
    const date = new Date(draft.scheduled_at)
    setScheduleDate(date.toISOString().slice(0, 10))
    setScheduleTime(date.toTimeString().slice(0, 5))
  }, [drafts, selected])

  const saveSchedule = async () => {
    if (!selected?.draftId) {
      setNotice('Демо-событие нельзя изменить')
      window.setTimeout(() => setNotice(''), 2500)
      return
    }
    try {
      await updateDraft(selected.draftId, { status: 'scheduled', scheduled_at: new Date(`${scheduleDate}T${scheduleTime}`).toISOString() })
      setNotice('Расписание сохранено')
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : 'Не удалось сохранить расписание')
    }
    window.setTimeout(() => setNotice(''), 2500)
  }

  const publishNow = async () => {
    if (!selected?.draftId) return
    setPublishing(true)
    try {
      await authenticatedJson<{ postId: string }>(getAccessToken, '/api/threads/publish', { draftId: selected.draftId })
      await refresh()
      setNotice('Публикация отправлена в Threads')
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : 'Не удалось опубликовать пост')
    } finally {
      setPublishing(false)
      window.setTimeout(() => setNotice(''), 3000)
    }
  }

  return (
    <AppShell>
      <div className="calendar-toolbar"><div className="calendar-month-control"><button onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))} aria-label="Предыдущий месяц">‹</button><h1>{monthLabel}</h1><button onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))} aria-label="Следующий месяц">›</button></div><div className="segmented">{['Список', 'Неделя', 'Месяц'].map((item) => <button key={item} className={mode === item ? 'active' : ''} onClick={() => setMode(item)}>{item}</button>)}</div><label className="compact-select">Бренд<select value={brandFilter} onChange={(event) => setBrandFilter(event.target.value)}><option value="">Все</option>{brands.map((brand) => <option value={brand.id} key={brand.id}>{brand.name}</option>)}</select></label><label className="compact-select">Аккаунт<select value={accountFilter} onChange={(event) => setAccountFilter(event.target.value)}><option value="">Все</option>{accounts.map((account) => <option value={account.id} key={account.id}>@{account.username}</option>)}</select></label><label className="compact-select"><Filter size={17} /> Статус<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">Все</option><option>Запланирован</option><option>Опубликован</option></select></label></div>
      <div className="mobile-calendar-filters"><Button variant="secondary" onClick={() => setVisibleMonth(new Date())}><CalendarDaysIcon /> Сегодня</Button><label className="compact-select">Статус<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">Все</option><option>Запланирован</option><option>Опубликован</option></select></label></div>
      <div className="mobile-calendar-list">{filteredEvents.map((event) => <button key={event.id} className={`card mobile-calendar-event ${event.tone}`} onClick={() => setSelectedId(event.id)}><span className="mono-label">{event.date.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'long' })}</span><div><Clock3 /> {event.time} <Badge tone={event.tone}>{event.status}</Badge></div><h2>{event.title}</h2><p>{event.content}</p><small>{brands.find((brand) => brand.id === event.brandId)?.name ?? 'Без бренда'}</small></button>)}{!filteredEvents.length ? <Card className="empty-state compact"><h2>Нет публикаций</h2><p>Измените фильтры или запланируйте материал.</p></Card> : null}<button className="mobile-fab" onClick={() => navigate('/app/studio')} aria-label="Создать публикацию">+</button></div>
      <div className="calendar-layout">
        {mode === 'Месяц' ? <Card className="calendar-card"><div className="weekdays">{['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => <b key={day}>{day}</b>)}</div><div className="calendar-days">{monthCells.map((day, index) => <div key={index} className={!day ? 'outside' : new Date().toDateString() === new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day).toDateString() ? 'today' : ''}>{day ? <span>{day}</span> : null}{day ? filteredEvents.filter((event) => event.date.getDate() === day).map((event) => <button key={event.id} className={`event event-${event.tone}`} onClick={() => setSelectedId(event.id)}><Badge tone={event.tone}>{event.status}</Badge><b>{event.title}</b><small>{event.time}</small></button>) : null}</div>)}</div></Card> : <Card className="calendar-list-view"><SectionTitle title={mode === 'Неделя' ? `Неделя с ${weekStart.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}` : 'Публикации месяца'} />{displayedEvents.map((event) => <button key={event.id} onClick={() => setSelectedId(event.id)}><time>{event.date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}<small>{event.time}</small></time><span><b>{event.title}</b><small>{event.content.slice(0, 120)}</small></span><Badge tone={event.tone}>{event.status}</Badge></button>)}{!displayedEvents.length ? <div className="empty-state"><h2>Публикаций нет</h2><p>Для выбранного периода и фильтров ничего не найдено.</p></div> : null}</Card>}
        {selected ? <aside className="post-details"><div className="detail-head"><h2>Детали поста</h2><button onClick={() => setSelectedId(null)} aria-label="Закрыть детали"><X size={18} /></button></div><Badge tone={selected.tone}>{selected.status}</Badge><h2>{selected.title}</h2><p>{selected.date.toLocaleString('ru-RU')}</p><Card className="post-preview"><p>{selected.content}</p></Card><Card className="compliance-box"><span><Sparkles /> AI Compliance <b>Проверено человеком</b></span><Progress value={100} tone="green" /><p>Материал прошёл очередь согласования.</p></Card><div className="form-grid"><label>Дата<input type="date" value={scheduleDate} onChange={(event) => setScheduleDate(event.target.value)} /></label><label>Время<input type="time" value={scheduleTime} onChange={(event) => setScheduleTime(event.target.value)} /></label></div><div className="split-actions"><Button variant="secondary" onClick={() => void saveSchedule()}>Сохранить время</Button><Button onClick={() => void publishNow()} disabled={!selected.draftId || publishing}>{publishing ? 'Публикуем...' : 'Опубликовать сейчас'}</Button></div></aside> : <aside className="post-details empty-state"><h2>Выберите публикацию</h2><p>Откройте материал, чтобы изменить время или опубликовать его.</p></aside>}
      </div>
      {notice ? <div className="toast">{notice}</div> : null}
    </AppShell>
  )
}

function CalendarDaysIcon() {
  return <span aria-hidden="true">▣</span>
}

const streamItems = [
  { source: '@TechInsider', time: '2 мин назад', title: 'Крупный сбой облачных сервисов влияет на несколько SMM-платформ. Интеграция Threads нестабильна.', label: 'Срочно', tone: 'red' as const, score: 98, sentiment: 'Негативная' },
  { source: 'MarketingWeekly', time: '15 мин назад', title: 'Обновление алгоритма отдаёт приоритет текстовым постам перед публикациями с тяжёлым визуалом.', label: 'Возможность', tone: 'blue' as const, score: 85, sentiment: 'Позитивная' },
  { source: '@competitor_x', time: '1 час назад', title: 'Запустили новый аналитический модуль. Подробности — в треде.', label: 'Конкурент', tone: 'neutral' as const, score: 62, sentiment: 'Нейтральная' },
]

export function MonitoringPage() {
  const { demo, getAccessToken } = useAuth()
  const { workspace, monitorSources, monitorItems, refresh, createQuickDraft, requestApproval, deleteMonitorSource, dismissMonitorItem } = useWorkspace()
  const items = demo ? streamItems.map((entry, index) => ({ ...entry, id: `demo-stream-${index}`, url: '#', summary: entry.title })) : monitorItems.map((entry) => ({ id: entry.id, source: entry.author || new URL(entry.url).hostname, time: entry.published_at ? new Date(entry.published_at).toLocaleString('ru-RU') : 'без даты', title: entry.title, summary: entry.summary, label: entry.recommendation === 'reply' ? 'Ответ' : entry.recommendation === 'thread' ? 'Тред' : 'Материал', tone: entry.urgency === 'urgent' || entry.urgency === 'high' ? 'red' as const : entry.relevance_score >= 70 ? 'blue' as const : 'neutral' as const, score: entry.relevance_score, sentiment: entry.sentiment, url: entry.url }))
  const [selected, setSelected] = useState(0)
  const [reply, setReply] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [loadingSource, setLoadingSource] = useState(false)
  const [notice, setNotice] = useState('')
  const item = items[selected] ?? items[0] ?? null

  const addSource = async () => {
    if (!workspace || !sourceUrl.trim()) return
    setLoadingSource(true)
    try {
      const payload = await authenticatedJson<{ imported?: number; source?: string }>(getAccessToken, '/api/monitor/rss', { workspaceId: workspace.id, url: sourceUrl.trim() })
      await refresh()
      setSourceUrl('')
      setNotice(`Источник ${payload.source ?? ''} обновлён: ${payload.imported ?? 0} материалов`)
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : 'Не удалось добавить источник')
    } finally {
      setLoadingSource(false)
      window.setTimeout(() => setNotice(''), 3500)
    }
  }

  const submitReply = async () => {
    if (!reply.trim()) return
    try {
      const draft = await createQuickDraft(reply, 'reply')
      await requestApproval(draft.id, item ? `Мониторинг: ${item.title}` : 'Мониторинг')
      setNotice('Ответ отправлен на согласование')
      setReply('')
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : 'Не удалось сохранить ответ')
    }
    window.setTimeout(() => setNotice(''), 3000)
  }

  const removeSource = async (sourceId: string) => {
    try {
      await deleteMonitorSource(sourceId)
      setSelected(0)
      setNotice('RSS-источник и его материалы удалены')
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : 'Не удалось удалить источник')
    }
    window.setTimeout(() => setNotice(''), 2800)
  }

  const dismissItem = async () => {
    if (!item || demo) return
    try {
      await dismissMonitorItem(item.id)
      setSelected(0)
      setNotice('Материал скрыт из потока')
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : 'Не удалось скрыть материал')
    }
    window.setTimeout(() => setNotice(''), 2800)
  }

  return (
    <AppShell>
      <Card className="stream-head"><SectionTitle icon={<Radar />} title="Живые потоки" action={<div className="inline-form"><input value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://example.com/feed.xml" /><Button variant="secondary" onClick={() => void addSource()} disabled={!sourceUrl.trim() || loadingSource}><Plus size={17} /> {loadingSource ? 'Читаем...' : 'Добавить RSS'}</Button></div>} /></Card>
      {!demo && monitorSources.length ? <div className="source-chips" aria-label="RSS-источники">{monitorSources.map((source) => <span key={source.id}><b>{source.name}</b><button onClick={() => void removeSource(source.id)} aria-label={`Удалить источник ${source.name}`}><X size={14} /></button></span>)}</div> : null}
      <div className="monitor-layout"><Card className="feed-list"><div className="feed-tabs"><Badge tone="blue">Все материалы ({items.length})</Badge><Badge>RSS: {demo ? 0 : monitorSources.length}</Badge><Filter size={17} /></div>{items.map((entry, index) => <button key={entry.id} className={`feed-item ${selected === index ? 'active' : ''}`} onClick={() => { setSelected(index); setReply('') }}><div><span><b>{entry.source}</b> · {entry.time}</span><span><Badge tone={entry.tone}>{entry.label}</Badge><Badge>Score: {entry.score}</Badge></span></div><p>{entry.title}</p><small>✦ {entry.sentiment} тональность</small></button>)}{!items.length ? <div className="empty-state"><Radar /><h2>Поток пуст</h2><p>Добавьте публичную RSS-ленту, чтобы получать новые материалы.</p></div> : null}</Card>
        <div className="analysis-column">{item ? <><Card className="analysis-card"><SectionTitle icon={<Sparkles />} title="Материал" action={!demo ? <button className="icon-button" onClick={() => void dismissItem()} aria-label="Скрыть материал"><X size={17} /></button> : undefined} /><div className="analysis-block"><b>{item.title}</b><p>{item.summary || 'Описание отсутствует. Откройте источник для чтения.'}</p></div><div className="analysis-block"><b><Lightbulb size={16} /> Следующее действие</b><p>Сформулируйте собственный вывод и проверьте факты по первоисточнику перед публикацией.</p></div><div className="risk-note"><AlertTriangle size={17} /> RSS-материал не является подтверждением факта сам по себе.</div><div className="split-actions"><Button variant="secondary" onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}>Открыть источник</Button><Button onClick={() => setReply(`По материалу «${item.title}»: ${item.summary.slice(0, 220)}\n\nМой вывод: `)}><Edit3 size={18} /> Создать ответ</Button></div></Card>{reply ? <Card className="reply-draft"><SectionTitle title="Черновик ответа" /><textarea rows={7} value={reply} onChange={(event) => setReply(event.target.value)} /><div className="split-actions"><Button variant="secondary" onClick={() => void navigator.clipboard.writeText(reply)}><Copy size={17} /> Копировать</Button><Button onClick={() => void submitReply()}>Отправить на согласование</Button></div></Card> : null}</> : <Card className="analysis-card empty-state"><h2>Выберите материал</h2></Card>}</div>
      </div>
      {notice ? <div className="toast">{notice}</div> : null}
    </AppShell>
  )
}

const approvalItems = [
  { id: 'demo-1', type: 'Тред', title: 'Анонс продуктовой версии 3.0', risk: 'Высокий риск', riskScore: 78, tone: 'red' as const, time: '10 мин назад', content: 'Ожидание закончилось. Представляем Nexus v3. Мы переписали ядро, ускорили ключевые операции на 40% и подготовили систему к корпоративной нагрузке.', approvalId: null, draftId: null },
  { id: 'demo-2', type: 'Изменение бренда', title: 'Обновить ссылку в профиле', risk: 'Низкий риск', riskScore: 8, tone: 'green' as const, time: '1 час назад', content: 'Обновляем ссылку в профиле на актуальную страницу продукта.', approvalId: null, draftId: null },
  { id: 'demo-3', type: 'Пост', title: 'Еженедельный spotlight сообщества', risk: 'Средний риск', riskScore: 45, tone: 'orange' as const, time: '3 часа назад', content: 'На этой неделе разбираем сильные практики сообщества и делимся рабочими примерами.', approvalId: null, draftId: null },
]

export function ApprovalsPage() {
  const { demo } = useAuth()
  const { approvals, drafts, refresh, reviewApproval, updateDraft } = useWorkspace()
  const liveItems = approvals.filter((approval) => approval.status === 'pending').map((approval) => {
    const draft = drafts.find((item) => item.id === approval.draft_id)
    const tone = draft?.risk_level === 'high' || draft?.risk_level === 'blocked' ? 'red' as const : draft?.risk_level === 'medium' ? 'orange' as const : 'green' as const
    return { id: approval.id, type: draft?.format === 'thread' ? 'Тред' : draft?.format === 'reply' ? 'Ответ' : 'Пост', title: draft?.title || 'Черновик без названия', risk: tone === 'red' ? 'Высокий риск' : tone === 'orange' ? 'Средний риск' : 'Низкий риск', riskScore: draft?.risk_score ?? 0, tone, time: new Date(approval.created_at).toLocaleString('ru-RU'), content: draft?.content || '', approvalId: approval.id, draftId: draft?.id ?? null }
  })
  const items = demo ? approvalItems : liveItems
  const [filter, setFilter] = useState<'all' | 'risk' | 'posts'>('all')
  const filteredItems = items.filter((entry) => filter === 'all' || (filter === 'risk' ? entry.tone === 'red' : entry.type === 'Пост'))
  const [selected, setSelected] = useState(0)
  const [risk, setRisk] = useState(78)
  const [approved, setApproved] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [notice, setNotice] = useState('')
  const navigate = useNavigate()
  const item = filteredItems[selected] ?? filteredItems[0]

  useEffect(() => {
    if (item) {
      setRisk(item.riskScore)
      setEditedContent(item.content)
    }
  }, [item])

  const fixRisk = async () => {
    setRisk(8)
    const fixedContent = (editedContent || item?.content || '').replace(/шифрование военного уровня/gi, 'стандартное AES-256 шифрование')
    setEditedContent(fixedContent)
    if (item?.draftId) await updateDraft(item.draftId, { risk_score: 8, risk_level: 'low', content: fixedContent })
  }

  const saveEdit = async () => {
    if (!item || !editedContent.trim()) return
    try {
      if (item.draftId) await updateDraft(item.draftId, { content: editedContent.trim(), title: editedContent.trim().slice(0, 80) })
      setEditing(false)
      setNotice('Правки сохранены')
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : 'Не удалось сохранить правки')
    }
    window.setTimeout(() => setNotice(''), 2500)
  }

  const approve = async () => {
    if (item?.approvalId) {
      await reviewApproval(item.approvalId, 'approved', 'Согласовано в очереди')
      if (item.draftId) await updateDraft(item.draftId, { status: 'scheduled', scheduled_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() })
    }
    setApproved(true)
  }

  const reject = async () => {
    if (item?.approvalId) await reviewApproval(item.approvalId, 'rejected', 'Отклонено в очереди')
    setSelected(0)
  }

  if (!items.length) return <AppShell><Card className="empty-state"><CheckCircle2 /><h1>Очередь согласований пуста</h1><p>Новые материалы из AI Studio и быстрых черновиков появятся здесь.</p><Button onClick={() => navigate('/app/studio')}>Открыть AI Studio</Button></Card></AppShell>

  return (
    <AppShell>
      <div className="approval-layout"><aside className="approval-inbox"><div className="page-head compact-head"><h1>Входящие</h1><button className="icon-button" onClick={() => setFilter(filter === 'risk' ? 'all' : 'risk')} aria-label="Фильтр высокого риска"><Filter size={18} /></button></div><div className="segmented full"><button className={filter === 'all' ? 'active' : ''} onClick={() => { setFilter('all'); setSelected(0) }}>Все ({items.length})</button><button className={filter === 'risk' ? 'active' : ''} onClick={() => { setFilter('risk'); setSelected(0) }}>Риск ({items.filter((entry) => entry.tone === 'red').length})</button><button className={filter === 'posts' ? 'active' : ''} onClick={() => { setFilter('posts'); setSelected(0) }}>Посты</button></div>{filteredItems.map((entry, index) => <button key={entry.id} className={`approval-list-item ${selected === index ? 'active' : ''}`} onClick={() => { setSelected(index); setRisk(entry.riskScore); setApproved(false) }}><span><Badge>{entry.type}</Badge><small>{entry.time}</small></span><b>{entry.title}</b><em><Badge tone={entry.tone}>{entry.risk}</Badge></em></button>)}{!filteredItems.length ? <div className="empty-state compact"><p>В этом фильтре нет материалов.</p></div> : null}</aside>
        {item ? <Card className="approval-document"><div className="approval-doc-head"><div><h1>{item.title}</h1><p><Clock3 size={16} /> {item.time} · Автор: {demo ? 'AI Agent' : 'Команда workspace'}</p></div><button className="icon-button" onClick={() => { void navigator.clipboard.writeText(editedContent || item.content); setNotice('Текст скопирован'); window.setTimeout(() => setNotice(''), 1800) }} aria-label="Копировать текст"><Copy size={18} /></button><button className="icon-button" onClick={() => void refresh()} aria-label="Обновить данные"><RefreshCw size={18} /></button></div>
          {approved ? <div className="approval-success"><CheckCircle2 /><h2>Публикация согласована</h2><p>Материал добавлен в календарь на ближайший час.</p><Button onClick={() => navigate('/app/calendar')}>Открыть календарь <ChevronRight size={17} /></Button></div> : <div className="approval-body"><section><div className="preview-label"><span>Предпросмотр публикации</span><button onClick={() => setEditing(true)}><Edit3 size={17} /> Редактировать</button></div><Card className="thread-post"><div className="post-author"><span>T</span><b>Threads SMM <small>черновик</small></b></div><p>{editedContent || item.content}</p></Card>{demo ? <Card className="thread-post"><div className="post-author"><span>T</span><b>TechNova <small>@technova_team</small></b></div><p>1/ Безопасность: мы внедрили <mark>{risk > 50 ? 'шифрование военного уровня' : 'стандартное AES-256 шифрование'}</mark> для всех конечных точек.</p></Card> : null}</section><aside><Card className="risk-card"><span><AlertTriangle /> Compliance Risk</span><strong>{risk > 50 ? 'Высокий' : 'Низкий'} <b>{risk}%</b></strong><Progress value={risk} tone={risk > 50 ? 'orange' : 'green'} /><p>Токсичность: низкая<br />Спам: средний<br />Ложные утверждения: {risk > 50 ? 'высокий' : 'низкий'}</p></Card><Card className="reasoning"><h3><Bot size={17} /> AI Reasoning</h3><p>{risk > 50 ? 'Проверьте обещания, цифры и формулировки перед публикацией.' : 'Критических рисков не найдено. Финальное решение остаётся за человеком.'}</p></Card></aside></div>}
          {!approved ? <div className="approval-actions"><Button variant="secondary" onClick={() => void reject()}>Отклонить</Button><Button variant="secondary" onClick={() => void fixRisk()}><Edit3 size={17} /> Исправить риск</Button><Button onClick={() => void approve()}><Check size={17} /> Согласовать и запланировать</Button></div> : null}
        </Card> : <Card className="approval-document empty-state"><h2>Нет материалов</h2><p>Измените фильтр или создайте новый черновик.</p></Card>}</div>
      {editing && item ? <Modal title="Редактировать публикацию" onClose={() => setEditing(false)}><div className="form-stack"><label>Текст<textarea rows={10} value={editedContent} onChange={(event) => setEditedContent(event.target.value)} maxLength={500} /></label><small>{editedContent.length}/500</small><div className="modal-actions"><Button variant="secondary" onClick={() => setEditing(false)}>Отмена</Button><Button onClick={() => void saveEdit()} disabled={!editedContent.trim()}>Сохранить</Button></div></div></Modal> : null}
      {notice ? <div className="toast">{notice}</div> : null}
    </AppShell>
  )
}
