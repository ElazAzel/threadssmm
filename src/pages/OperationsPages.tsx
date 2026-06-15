import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Bot, Check, CheckCircle2, ChevronRight, Clock3, Copy, Edit3, Filter, Lightbulb, Plus, Radar, RefreshCw, Sparkles, X } from 'lucide-react'
import { AppShell } from '../components/AppShell'
import { Badge, Button, Card, Progress, SectionTitle } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { useWorkspace } from '../contexts/WorkspaceContext'

const calendarEvents = [
  { id: 'demo-calendar-1', draftId: null, day: 2, title: 'Продуктовый дайджест', status: 'Опубликован', tone: 'green' as const, time: '09:00', content: 'Короткий дайджест продуктовых обновлений.' },
  { id: 'demo-calendar-2', draftId: null, day: 3, title: 'Q3: главные функции', status: 'Запланирован', tone: 'blue' as const, time: '14:30', content: 'Мы выпустили три обновления аналитики: отслеживание вовлечённости, еженедельные отчёты и сравнение контент-пилларов.' },
  { id: 'demo-calendar-3', draftId: null, day: 3, title: 'Контрарный взгляд на AI', status: 'Черновик', tone: 'orange' as const, time: '18:00', content: 'AI не заменяет редактора, а ускоряет проверяемые сценарии.' },
  { id: 'demo-calendar-4', draftId: null, day: 4, title: 'Бэкстейдж команды', status: 'Идея', tone: 'neutral' as const, time: '—', content: 'Показываем процесс команды без постановочных кадров.' },
]

export function CalendarPage() {
  const { demo, getAccessToken } = useAuth()
  const { drafts, updateDraft, refresh } = useWorkspace()
  const liveEvents = drafts.filter((draft) => draft.scheduled_at || draft.status === 'scheduled' || draft.status === 'published').map((draft) => {
    const date = draft.scheduled_at ? new Date(draft.scheduled_at) : new Date(draft.created_at)
    return { id: draft.id, draftId: draft.id, day: date.getDate(), title: draft.title || 'Публикация без названия', status: draft.status === 'published' ? 'Опубликован' : 'Запланирован', tone: draft.status === 'published' ? 'green' as const : 'blue' as const, time: date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }), content: draft.content }
  })
  const events = demo ? calendarEvents : liveEvents
  const [mode, setMode] = useState('Месяц')
  const [selectedId, setSelectedId] = useState<string | null>(events[0]?.id ?? null)
  const selected = events.find((event) => event.id === selectedId) ?? events[0] ?? null
  const [scheduleDate, setScheduleDate] = useState('2026-06-16')
  const [scheduleTime, setScheduleTime] = useState('14:30')
  const [notice, setNotice] = useState('')
  const [publishing, setPublishing] = useState(false)

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
      const token = await getAccessToken()
      const result = await fetch('/api/threads/publish', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ draftId: selected.draftId }) })
      const payload = await result.json() as { postId?: string; error?: string }
      if (!result.ok) throw new Error(payload.error || 'Не удалось опубликовать пост')
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
      <div className="calendar-toolbar"><h1>Июнь <span>2026</span></h1><div className="segmented">{['Список', 'Неделя', 'Месяц'].map((item) => <button key={item} className={mode === item ? 'active' : ''} onClick={() => setMode(item)}>{item}</button>)}</div><Button variant="secondary">Все бренды</Button><Button variant="secondary">Все аккаунты</Button><Button variant="secondary"><Filter size={17} /> Фильтр</Button></div>
      <div className="mobile-calendar-filters"><Button variant="secondary"><CalendarDaysIcon /> Июнь</Button><Button variant="secondary">Все бренды</Button><Button variant="secondary"><Filter size={16} /> Статус</Button></div>
      <div className="mobile-calendar-list"><span className="mono-label">Пн, 16 июня</span><Card className="mobile-calendar-event scheduled"><div><Clock3 /> 09:00 <Badge tone="blue">Запланирован</Badge></div><h2>Запуск маркетинговой кампании Q3</h2><p>Анонсирующий тред с видеоматериалами.</p><small>TechNova</small></Card><Card className="mobile-calendar-event draft"><div><Edit3 /> Время не задано <Badge>Черновик</Badge></div><h2>Идеи для бэкстейджа команды</h2><small>TechNova</small></Card><span className="mono-label">Вт, 17 июня</span><Card className="mobile-calendar-event review"><div><Clock3 /> 14:30 <Badge tone="orange">Согласование</Badge></div><h2>Обзор новых инструментов AI Studio</h2><small>Lumina Labs</small></Card><button className="mobile-fab" onClick={() => setNotice('Создан новый черновик')}>+</button></div>
      <div className="calendar-layout">
        <Card className="calendar-card"><div className="weekdays">{['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => <b key={day}>{day}</b>)}</div><div className="calendar-days">{Array.from({ length: 35 }, (_, index) => index + 1).map((day) => <div key={day} className={day === 15 ? 'today' : ''}><span>{day}</span>{events.filter((event) => event.day === day).map((event) => <button key={event.id} className={`event event-${event.tone}`} onClick={() => setSelectedId(event.id)}><Badge tone={event.tone}>{event.status}</Badge><b>{event.title}</b><small>{event.time}</small></button>)}</div>)}</div></Card>
        {selected ? <aside className="post-details"><div className="detail-head"><h2>Детали поста</h2><button><Edit3 size={18} /></button><button><X size={18} /></button></div><Badge tone={selected.tone}>{selected.status}</Badge><h2>{selected.title}</h2><p>{selected.time}</p><Card className="post-preview"><p>{selected.content}</p></Card><Card className="compliance-box"><span><Sparkles /> AI Compliance <b>Проверено человеком</b></span><Progress value={100} tone="green" /><p>Материал прошёл очередь согласования.</p></Card><div className="form-grid"><label>Дата<input type="date" value={scheduleDate} onChange={(event) => setScheduleDate(event.target.value)} /></label><label>Время<input type="time" value={scheduleTime} onChange={(event) => setScheduleTime(event.target.value)} /></label></div><div className="split-actions"><Button variant="secondary" onClick={() => void saveSchedule()}>Сохранить время</Button><Button onClick={() => void publishNow()} disabled={!selected.draftId || publishing}>{publishing ? 'Публикуем...' : 'Опубликовать сейчас'}</Button></div></aside> : <aside className="post-details empty-state"><h2>Календарь пуст</h2><p>Согласуйте публикацию, чтобы назначить дату и время.</p></aside>}
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
  const { workspace, monitorSources, monitorItems, refresh, createQuickDraft, requestApproval } = useWorkspace()
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
      const token = await getAccessToken()
      const result = await fetch('/api/monitor/rss', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ workspaceId: workspace.id, url: sourceUrl.trim() }) })
      const payload = await result.json() as { imported?: number; source?: string; error?: string }
      if (!result.ok) throw new Error(payload.error || 'Не удалось добавить RSS')
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

  return (
    <AppShell>
      <Card className="stream-head"><SectionTitle icon={<Radar />} title="Живые потоки" action={<div className="inline-form"><input value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://example.com/feed.xml" /><Button variant="secondary" onClick={() => void addSource()} disabled={!sourceUrl.trim() || loadingSource}><Plus size={17} /> {loadingSource ? 'Читаем...' : 'Добавить RSS'}</Button></div>} /></Card>
      <div className="monitor-layout"><Card className="feed-list"><div className="feed-tabs"><Badge tone="blue">Все материалы ({items.length})</Badge><Badge>RSS: {demo ? 0 : monitorSources.length}</Badge><Filter size={17} /></div>{items.map((entry, index) => <button key={entry.id} className={`feed-item ${selected === index ? 'active' : ''}`} onClick={() => { setSelected(index); setReply('') }}><div><span><b>{entry.source}</b> · {entry.time}</span><span><Badge tone={entry.tone}>{entry.label}</Badge><Badge>Score: {entry.score}</Badge></span></div><p>{entry.title}</p><small>✦ {entry.sentiment} тональность</small></button>)}{!items.length ? <div className="empty-state"><Radar /><h2>Поток пуст</h2><p>Добавьте публичную RSS-ленту, чтобы получать новые материалы.</p></div> : null}</Card>
        <div className="analysis-column">{item ? <><Card className="analysis-card"><SectionTitle icon={<Sparkles />} title="Материал" /><div className="analysis-block"><b>{item.title}</b><p>{item.summary || 'Описание отсутствует. Откройте источник для чтения.'}</p></div><div className="analysis-block"><b><Lightbulb size={16} /> Следующее действие</b><p>Сформулируйте собственный вывод и проверьте факты по первоисточнику перед публикацией.</p></div><div className="risk-note"><AlertTriangle size={17} /> RSS-материал не является подтверждением факта сам по себе.</div><div className="split-actions"><Button variant="secondary" onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}>Открыть источник</Button><Button onClick={() => setReply(`По материалу «${item.title}»: ${item.summary.slice(0, 220)}\n\nМой вывод: `)}><Edit3 size={18} /> Создать ответ</Button></div></Card>{reply ? <Card className="reply-draft"><SectionTitle title="Черновик ответа" /><textarea rows={7} value={reply} onChange={(event) => setReply(event.target.value)} /><div className="split-actions"><Button variant="secondary" onClick={() => void navigator.clipboard.writeText(reply)}><Copy size={17} /> Копировать</Button><Button onClick={() => void submitReply()}>Отправить на согласование</Button></div></Card> : null}</> : <Card className="analysis-card empty-state"><h2>Выберите материал</h2></Card>}</div>
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
  const { approvals, drafts, reviewApproval, updateDraft } = useWorkspace()
  const liveItems = approvals.filter((approval) => approval.status === 'pending').map((approval) => {
    const draft = drafts.find((item) => item.id === approval.draft_id)
    const tone = draft?.risk_level === 'high' || draft?.risk_level === 'blocked' ? 'red' as const : draft?.risk_level === 'medium' ? 'orange' as const : 'green' as const
    return { id: approval.id, type: draft?.format === 'thread' ? 'Тред' : draft?.format === 'reply' ? 'Ответ' : 'Пост', title: draft?.title || 'Черновик без названия', risk: tone === 'red' ? 'Высокий риск' : tone === 'orange' ? 'Средний риск' : 'Низкий риск', riskScore: draft?.risk_score ?? 0, tone, time: new Date(approval.created_at).toLocaleString('ru-RU'), content: draft?.content || '', approvalId: approval.id, draftId: draft?.id ?? null }
  })
  const items = demo ? approvalItems : liveItems
  const [selected, setSelected] = useState(0)
  const [risk, setRisk] = useState(78)
  const [approved, setApproved] = useState(false)
  const navigate = useNavigate()
  const item = items[selected] ?? items[0]

  useEffect(() => {
    if (item) setRisk(item.riskScore)
  }, [item])

  const fixRisk = async () => {
    setRisk(8)
    if (item?.draftId) await updateDraft(item.draftId, { risk_score: 8, risk_level: 'low', content: item.content.replace(/шифрование военного уровня/gi, 'стандартное AES-256 шифрование') })
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

  if (!item) return <AppShell><Card className="empty-state"><CheckCircle2 /><h1>Очередь согласований пуста</h1><p>Новые материалы из AI Studio и быстрых черновиков появятся здесь.</p><Button onClick={() => navigate('/app/studio')}>Открыть AI Studio</Button></Card></AppShell>

  return (
    <AppShell>
      <div className="approval-layout"><aside className="approval-inbox"><div className="page-head compact-head"><h1>Входящие</h1><button className="icon-button"><Filter size={18} /></button></div><div className="segmented full"><button className="active">Все ({items.length})</button><button>Риск ({items.filter((entry) => entry.tone === 'red').length})</button><button>Черновики</button></div>{items.map((entry, index) => <button key={entry.id} className={`approval-list-item ${selected === index ? 'active' : ''}`} onClick={() => { setSelected(index); setRisk(entry.riskScore); setApproved(false) }}><span><Badge>{entry.type}</Badge><small>{entry.time}</small></span><b>{entry.title}</b><em><Badge tone={entry.tone}>{entry.risk}</Badge></em></button>)}</aside>
        <Card className="approval-document"><div className="approval-doc-head"><div><h1>{item.title}</h1><p><Clock3 size={16} /> Сегодня, 14:00 · Автор: AI Agent Alpha</p></div><button className="icon-button"><Copy size={18} /></button><button className="icon-button"><RefreshCw size={18} /></button></div>
          {approved ? <div className="approval-success"><CheckCircle2 /><h2>Публикация согласована</h2><p>Материал добавлен в календарь на ближайший час.</p><Button onClick={() => navigate('/app/calendar')}>Открыть календарь <ChevronRight size={17} /></Button></div> : <div className="approval-body"><section><div className="preview-label"><span>Предпросмотр публикации</span><button><Edit3 size={17} /> Редактировать</button></div><Card className="thread-post"><div className="post-author"><span>T</span><b>Threads SMM <small>черновик</small></b></div><p>{item.content}</p></Card>{demo ? <Card className="thread-post"><div className="post-author"><span>T</span><b>TechNova <small>@technova_team</small></b></div><p>1/ Безопасность: мы внедрили <mark>{risk > 50 ? 'шифрование военного уровня' : 'стандартное AES-256 шифрование'}</mark> для всех конечных точек.</p></Card> : null}</section><aside><Card className="risk-card"><span><AlertTriangle /> Compliance Risk</span><strong>{risk > 50 ? 'Высокий' : 'Низкий'} <b>{risk}%</b></strong><Progress value={risk} tone={risk > 50 ? 'orange' : 'green'} /><p>Токсичность: низкая<br />Спам: средний<br />Ложные утверждения: {risk > 50 ? 'высокий' : 'низкий'}</p></Card><Card className="reasoning"><h3><Bot size={17} /> AI Reasoning</h3><p>{risk > 50 ? 'Проверьте обещания, цифры и формулировки перед публикацией.' : 'Критических рисков не найдено. Финальное решение остаётся за человеком.'}</p></Card></aside></div>}
          {!approved ? <div className="approval-actions"><Button variant="secondary" onClick={() => void reject()}>Отклонить</Button><Button variant="secondary" onClick={() => void fixRisk()}><Edit3 size={17} /> Исправить риск</Button><Button onClick={() => void approve()}><Check size={17} /> Согласовать и запланировать</Button></div> : null}
        </Card></div>
    </AppShell>
  )
}
