import { ArrowUpRight, BarChart3, CalendarDays, CheckSquare, Clock3, Lightbulb, MessageSquare, Radar, Sparkles, UsersRound } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Badge, Button, Card, Progress, SectionTitle } from '../components/ui'
import { useWorkspace } from '../contexts/WorkspaceContext'

export function DashboardPage() {
  const navigate = useNavigate()
  const { accounts, approvals, drafts, workspace, monitorItems } = useWorkspace()
  const pending = approvals.filter((approval) => approval.status === 'pending').length
  const scheduled = drafts.filter((draft) => draft.status === 'scheduled')
  const [monitorFilter, setMonitorFilter] = useState<'all' | 'mentions'>('all')
  const visibleMonitorItems = monitorFilter === 'mentions' ? monitorItems.filter((item) => item.author.startsWith('@')) : monitorItems
  return (
    <AppShell title="Threads SMM Agent">
      <MobileDashboard />
      <div className="dashboard-grid desktop-dashboard">
        <div className="metric-grid dashboard-metrics">
          <Card className="metric-card"><span>Подключено аккаунтов <UsersRound size={19} /></span><strong>{accounts.length}</strong></Card>
          <Card className="metric-card"><span>Ждут согласования <CheckSquare size={19} /></span><strong>{pending} <small>нужны действия</small></strong></Card>
          <Card className="metric-card"><span>Осталось AI-кредитов <Sparkles size={19} /></span><strong>{workspace?.ai_credits ?? 0} <small>/ 200</small></strong><Progress value={Math.min(100, ((workspace?.ai_credits ?? 0) / 200) * 100)} tone="orange" /></Card>
          <Card className="metric-card"><span>Опубликовано <BarChart3 size={19} /></span><strong>{drafts.filter((draft) => draft.status === 'published').length}</strong></Card>
        </div>

        <section>
          <SectionTitle icon={<CheckSquare />} title="Действия на сегодня" />
          <Card className="action-list">
            <div><span><CheckSquare /><b>Согласовать {pending} черновиков</b><small>{pending ? 'Материалы ждут решения' : 'Очередь пуста'}</small></span><Button onClick={() => navigate('/app/approvals')}>Проверить</Button></div>
            <div><span><MessageSquare /><b>Проверить {monitorItems.length} сигналов</b><small>Материалы из RSS-мониторинга</small></span><Button onClick={() => navigate('/app/monitoring')} variant="secondary">Открыть</Button></div>
            <div><span><Clock3 /><b>В расписании {scheduled.length} постов</b><small>Проверьте время и аккаунт</small></span><Button onClick={() => navigate('/app/calendar')} variant="secondary">К календарю</Button></div>
          </Card>
        </section>

        <section className="dashboard-insights">
          <SectionTitle icon={<Sparkles />} title="AI-рекомендации" />
          <div className="insight-grid">
            <Card className="highlight-card"><Badge tone="orange">Следующий шаг</Badge><h3>{monitorItems[0]?.title || 'Создайте первый системный черновик'}</h3><p>{monitorItems[0]?.summary || 'Заполните профиль бренда и сформулируйте основную мысль в AI Studio.'}</p><button onClick={() => navigate(monitorItems.length ? '/app/monitoring' : '/app/studio')}>{monitorItems.length ? 'Открыть сигнал' : 'Создать черновик'} <ArrowUpRight size={17} /></button></Card>
            <div className="stack-cards"><Card><Lightbulb /><div><h3>Проверяемые выводы</h3><p>AI не публикует материалы без согласования человека.</p></div></Card><Card className="warning-card"><CalendarDays /><div><h3>Контент-ритм</h3><p>{scheduled.length ? `Запланировано: ${scheduled.length}` : 'Расписание пусто. Добавьте согласованный пост.'}</p></div></Card></div>
          </div>
        </section>

        <section>
          <SectionTitle icon={<CalendarDays />} title="Ближайшие публикации" action={<button className="text-button" onClick={() => navigate('/app/calendar')}>Весь календарь</button>} />
          <Card className="schedule-preview">{scheduled.slice(0, 3).map((draft) => { const date = new Date(draft.scheduled_at || draft.created_at); return <div key={draft.id}><time>{date.toLocaleDateString('ru-RU', { weekday: 'short' })}<strong>{date.getDate()}</strong></time><span><b>{draft.title || 'Без названия'}</b><small>{date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} · запланировано</small></span></div> })}{!scheduled.length ? <p className="centered-note">Ближайших публикаций нет.</p> : null}<button onClick={() => navigate('/app/calendar')}>+ Запланировать пост</button></Card>
        </section>

        <section>
          <SectionTitle icon={<Radar />} title="Мониторинг тем" action={<div className="segmented"><button className={monitorFilter === 'all' ? 'active' : ''} onClick={() => setMonitorFilter('all')}>Все темы</button><button className={monitorFilter === 'mentions' ? 'active' : ''} onClick={() => setMonitorFilter('mentions')}>Упоминания</button></div>} />
          <Card className="topic-table table-wrap">
            {visibleMonitorItems.length ? <table><thead><tr><th>Материал</th><th>Источник</th><th>Тональность</th><th>Релевантность</th></tr></thead><tbody>{visibleMonitorItems.slice(0, 5).map((item) => <tr key={item.id}><td><b>{item.title}</b><small>{item.summary.slice(0, 80)}</small></td><td>{item.author || new URL(item.url).hostname}</td><td><Badge>{item.sentiment}</Badge></td><td><strong className="score-ring">{item.relevance_score}</strong></td></tr>)}</tbody></table> : <div className="empty-state"><p>{monitorFilter === 'mentions' ? 'Упоминаний пока нет.' : 'Добавьте RSS-источник в мониторинге.'}</p></div>}
          </Card>
        </section>
      </div>
    </AppShell>
  )
}

function MobileDashboard() {
  const navigate = useNavigate()
  const { accounts, approvals, drafts, workspace, monitorItems } = useWorkspace()
  const pending = approvals.filter((approval) => approval.status === 'pending').length
  const scheduled = drafts.filter((draft) => draft.status === 'scheduled')
  return <div className="mobile-dashboard">
    <div className="mobile-metric-grid"><Card><UsersRound /><strong>{accounts.length}</strong><span>Подключено аккаунтов</span></Card><Card><CheckSquare /><strong>{pending}</strong><span>Ждут согласования</span><i /></Card><Card className="mobile-credit-card"><Sparkles /><strong>{workspace?.ai_credits ?? 0}</strong><span>Осталось AI-кредитов</span><Button variant="secondary" onClick={() => navigate('/app/billing')}>Лимиты</Button></Card></div>
    <section><SectionTitle title="Фокус на сегодня" /><Card className="mobile-focus-card"><Badge tone="blue">Нужно действие</Badge><p>{pending ? `Проверить ${pending} материалов` : 'Очередь согласований пуста'}</p><Button onClick={() => navigate(pending ? '/app/approvals' : '/app/studio')}>{pending ? 'Проверить' : 'Создать'}</Button></Card></section>
    <section><SectionTitle title="Ближайшие публикации" /><div className="mobile-schedule-list">{scheduled.slice(0, 3).map((draft) => { const date = new Date(draft.scheduled_at || draft.created_at); return <Card key={draft.id}><time>{date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}<small>{date.toLocaleDateString('ru-RU')}</small></time><span><b>{draft.title || 'Без названия'}</b><small>Threads</small></span><i /></Card> })}{!scheduled.length ? <Card><p>Расписание пусто</p></Card> : null}</div><button className="mobile-view-all" onClick={() => navigate('/app/calendar')}>Весь календарь →</button></section>
    <section><SectionTitle title="Живой мониторинг" /><Card className="mobile-monitor-card"><div className="feed-tabs"><Badge tone="blue">RSS</Badge><Badge>{monitorItems.length} материалов</Badge></div>{monitorItems.slice(0, 2).map((item) => <article key={item.id}><span className="account-avatar">R</span><p><b>{item.title}</b>{item.summary.slice(0, 100)}<small>{item.published_at ? new Date(item.published_at).toLocaleString('ru-RU') : 'без даты'}</small></p></article>)}{!monitorItems.length ? <p>Добавьте RSS-источник.</p> : null}</Card></section>
  </div>
}
