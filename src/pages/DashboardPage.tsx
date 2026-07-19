import { ArrowUpRight, BarChart3, Bell, CalendarDays, CheckSquare, Clock3, Lightbulb, MessageSquare, Radar, Sparkles, UsersRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Badge, Button, Card, Progress, SectionTitle } from '../components/ui'
import { useWorkspace } from '../contexts/WorkspaceContext'

export function DashboardPage() {
  const navigate = useNavigate()
  const { accounts, approvals, drafts, workspace, monitorItems } = useWorkspace()
  const pending = approvals.filter((approval) => approval.status === 'pending').length
  const scheduled = drafts.filter((draft) => draft.status === 'scheduled')
  const failedCount = drafts.filter((draft) => draft.status === 'failed').length
  const totalActions = pending + failedCount + monitorItems.length

  return (
    <AppShell>
      <div className="dashboard">
        <div className="dashboard-head">
          <div>
            <h1>Обзор</h1>
            <p>{workspace?.name ? `Рабочее пространство: ${workspace.name}` : 'Добро пожаловать'}</p>
          </div>
          <div className="dashboard-head-actions">
            <Button onClick={() => navigate('/app/studio')}><Sparkles size={17} /> Создать пост</Button>
          </div>
        </div>

        {totalActions > 0 ? (
          <Card className="dashboard-attention">
            <Bell size={20} />
            <span>
              <b>Требуется внимание</b>
              <small>
                {[pending ? `согласований: ${pending}` : '', failedCount ? `ошибок: ${failedCount}` : '', monitorItems.length ? `сигналов: ${monitorItems.length}` : ''].filter(Boolean).join(' · ') || 'Всё в порядке'}
              </small>
            </span>
            <Button variant="secondary" onClick={() => navigate(pending ? '/app/approvals' : failedCount ? '/app/calendar' : '/app/monitoring')}>Проверить</Button>
          </Card>
        ) : null}

        <div className="metric-grid dashboard-metrics">
          <Card className="metric-card"><span>Аккаунты <UsersRound size={19} /></span><strong>{accounts.length}</strong></Card>
          <Card className="metric-card"><span>На согласовании <CheckSquare size={19} /></span><strong>{pending} <small>шт.</small></strong></Card>
          <Card className="metric-card"><span>AI-кредиты <Sparkles size={19} /></span><strong>{workspace?.ai_credits ?? 0}<small>/200</small></strong><Progress value={Math.min(100, ((workspace?.ai_credits ?? 0) / 200) * 100)} tone="orange" /></Card>
          <Card className="metric-card"><span>Опубликовано <BarChart3 size={19} /></span><strong>{drafts.filter((draft) => draft.status === 'published').length}</strong></Card>
        </div>

        <div className="dashboard-grid">
          <section>
            <SectionTitle icon={<CheckSquare />} title="Что нужно сделать" />
            <Card className="action-list">
              <div onClick={() => navigate('/app/approvals')}><span><CheckSquare /><b>Согласовать черновики</b><small>{pending ? `${pending} материалов ждут решения` : 'Очередь пуста'}</small></span>{pending ? <Badge tone="orange">{pending}</Badge> : <Badge>Готово</Badge>}</div>
              <div onClick={() => navigate('/app/monitoring')}><span><MessageSquare /><b>Проверить мониторинг</b><small>{monitorItems.length ? `${monitorItems.length} сигналов` : 'Сигналов нет'}</small></span>{monitorItems.length ? <Badge tone="blue">{monitorItems.length}</Badge> : <Badge>OK</Badge>}</div>
              <div onClick={() => navigate('/app/calendar')}><span><Clock3 /><b>Запланированные посты</b><small>{scheduled.length ? `${scheduled.length} в расписании` : 'Расписание пусто'}</small></span>{scheduled.length ? <Badge tone="accent">{scheduled.length}</Badge> : null}</div>
              {failedCount ? <div onClick={() => navigate('/app/calendar')}><span><CalendarDays /><b>Ошибки публикации</b><small>{failedCount} постов не опубликовано</small></span><Badge tone="red">{failedCount}</Badge></div> : null}
            </Card>
          </section>

          <section>
            <SectionTitle icon={<CalendarDays />} title="Ближайшие публикации" action={scheduled.length ? <button className="text-button" onClick={() => navigate('/app/calendar')}>Весь календарь</button> : null} />
            <Card className="schedule-preview">{scheduled.slice(0, 3).map((draft) => { const date = new Date(draft.scheduled_at || draft.created_at); return <div key={draft.id}><time>{date.toLocaleDateString('ru-RU', { weekday: 'short' })}<strong>{date.getDate()}</strong></time><span><b>{draft.title || 'Без названия'}</b><small>{date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</small></span></div> })}{!scheduled.length ? <div className="empty-state compact"><CalendarDays /><p>Нет запланированных постов. Создайте первый!</p><Button variant="secondary" onClick={() => navigate('/app/studio')}>Создать</Button></div> : null}</Card>
          </section>

          <section className="dashboard-insights">
            <SectionTitle icon={<Sparkles />} title="AI-рекомендации" />
            <div className="insight-grid">
              <Card className="highlight-card"><Badge tone="orange">Следующий шаг</Badge><h3>{monitorItems[0]?.title || 'Создайте первый черновик'}</h3><p>{monitorItems[0]?.summary || 'Заполните профиль бренда и создайте пост в AI Studio.'}</p><button onClick={() => navigate(monitorItems.length ? '/app/monitoring' : '/app/studio')}>{monitorItems.length ? 'Открыть сигнал' : 'Создать черновик'} <ArrowUpRight size={17} /></button></Card>
              <div className="stack-cards"><Card><Lightbulb /><div><h3>AI под контролем</h3><p>Все материалы проходят согласование перед публикацией.</p></div></Card></div>
            </div>
          </section>

          <section>
            <SectionTitle icon={<Radar />} title="Мониторинг" action={monitorItems.length ? <div className="segmented"><button className="active">Все</button><button>Упоминания</button></div> : null} />
            <Card className="topic-table table-wrap">
              {monitorItems.slice(0, 5).length ? <table><thead><tr><th>Материал</th><th>Источник</th><th>Тон</th></tr></thead><tbody>{monitorItems.slice(0, 5).map((item) => <tr key={item.id}><td><b>{item.title}</b><small>{item.summary.slice(0, 80)}</small></td><td>{item.author || 'RSS'}</td><td><Badge>{item.sentiment}</Badge></td></tr>)}</tbody></table> : <div className="empty-state compact"><Radar /><p>Добавьте RSS-источник в мониторинге.</p><Button variant="secondary" onClick={() => navigate('/app/monitoring')}>Настроить</Button></div>}
            </Card>
          </section>
        </div>
      </div>
    </AppShell>
  )
}
