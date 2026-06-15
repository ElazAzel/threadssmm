import { ArrowUpRight, BarChart3, CalendarDays, CheckSquare, Clock3, Lightbulb, MessageSquare, Radar, Sparkles, UsersRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Badge, Button, Card, Progress, SectionTitle } from '../components/ui'

export function DashboardPage() {
  const navigate = useNavigate()
  return (
    <AppShell title="Threads SMM Agent">
      <MobileDashboard />
      <div className="dashboard-grid desktop-dashboard">
        <div className="metric-grid dashboard-metrics">
          <Card className="metric-card"><span>Подключено аккаунтов <UsersRound size={19} /></span><strong>12 <small>↑2</small></strong></Card>
          <Card className="metric-card"><span>Ждут согласования <CheckSquare size={19} /></span><strong>4 <small>нужны действия</small></strong></Card>
          <Card className="metric-card"><span>Осталось AI-кредитов <Sparkles size={19} /></span><strong>650 <small>/ 1000</small></strong><Progress value={65} tone="orange" /></Card>
          <Card className="metric-card"><span>Средняя вовлечённость <BarChart3 size={19} /></span><strong>4.8% <small>↑0.5%</small></strong></Card>
        </div>

        <section>
          <SectionTitle icon={<CheckSquare />} title="Действия на сегодня" />
          <Card className="action-list">
            <div><span><CheckSquare /><b>Согласовать 4 черновика</b><small>Созданы в AI Studio</small></span><Button onClick={() => navigate('/app/approvals')}>Проверить</Button></div>
            <div><span><MessageSquare /><b>Проверить 3 ответа</b><small>Приоритетные упоминания</small></span><Button onClick={() => navigate('/app/monitoring')} variant="secondary">Открыть</Button></div>
            <div><span><Clock3 /><b>Запланировать 2 поста</b><small>Оптимальные окна сегодня</small></span><Button onClick={() => navigate('/app/calendar')} variant="secondary">К календарю</Button></div>
          </Card>
        </section>

        <section className="dashboard-insights">
          <SectionTitle icon={<Sparkles />} title="AI-рекомендации" />
          <div className="insight-grid">
            <Card className="highlight-card"><Badge tone="orange">Высокий эффект</Badge><h3>Отреагируйте на растущую тему</h3><p>Обсуждение AI-команд набирает обороты. Ваша аудитория лучше всего реагирует на практические контраргументы.</p><button onClick={() => navigate('/app/studio')}>Создать черновик <ArrowUpRight size={17} /></button></Card>
            <div className="stack-cards"><Card><Lightbulb /><div><h3>Вопросы работают лучше</h3><p>Посты с вопросом в первой строке дают на 42% больше ответов.</p></div></Card><Card className="warning-card"><CalendarDays /><div><h3>Пустое окно в расписании</h3><p>На четверг нет публикаций. Добавьте пост, чтобы сохранить ритм.</p></div></Card></div>
          </div>
        </section>

        <section>
          <SectionTitle icon={<CalendarDays />} title="Ближайшие публикации" action={<button className="text-button" onClick={() => navigate('/app/calendar')}>Весь календарь</button>} />
          <Card className="schedule-preview">
            <div><time>ПН<strong>16</strong></time><span><b>Тред об AI-агентах</b><small>09:00 · запланировано</small></span></div>
            <div><time>ВТ<strong>17</strong></time><span><b>Разбор обновления продукта</b><small>Черновик</small></span></div>
            <div><time>СР<strong>18</strong></time><span><b>Практика: контент без выгорания</b><small>14:30 · согласовано</small></span></div>
            <button onClick={() => navigate('/app/calendar')}>+ Запланировать пост</button>
          </Card>
        </section>

        <section>
          <SectionTitle icon={<Radar />} title="Мониторинг тем" action={<div className="segmented"><button className="active">Все темы</button><button>Упоминания</button></div>} />
          <Card className="topic-table table-wrap">
            <table><thead><tr><th>Тема</th><th>Объём</th><th>Тональность</th><th>Релевантность</th></tr></thead><tbody>
              <tr><td><b>#AIAgents</b><small>Инструменты и процессы</small></td><td>↗ 12.4k</td><td><Badge tone="green">Позитивная</Badge></td><td><strong className="score-ring">98</strong></td></tr>
              <tr><td><b>React 19</b><small>Релиз технологии</small></td><td>↗ 45.1k</td><td><Badge>Нейтральная</Badge></td><td><strong className="score-ring orange">85</strong></td></tr>
              <tr><td><b>AI-native SMM</b><small>Маркетинговый тренд</small></td><td>→ 8.2k</td><td><Badge tone="blue">Растёт</Badge></td><td><strong className="score-ring orange">72</strong></td></tr>
            </tbody></table>
          </Card>
        </section>
      </div>
    </AppShell>
  )
}

function MobileDashboard() {
  const navigate = useNavigate()
  return <div className="mobile-dashboard">
    <div className="mobile-metric-grid"><Card><UsersRound /><strong>12</strong><span>Подключено аккаунтов</span><Badge>+2%</Badge></Card><Card><CheckSquare /><strong>5</strong><span>Ждут согласования</span><i /></Card><Card className="mobile-credit-card"><Sparkles /><strong>650</strong><span>Осталось AI-кредитов</span><Button variant="secondary" onClick={() => navigate('/app/billing')}>Пополнить</Button></Card></div>
    <section><SectionTitle title="Фокус на сегодня" action={<span className="mono-label">Свайп</span>} /><Card className="mobile-focus-card"><Badge tone="blue">Нужно действие</Badge><p>Проверить черновик для @TechNova: «Новый релиз продукта»</p><Button onClick={() => navigate('/app/approvals')}>Проверить</Button></Card></section>
    <section><SectionTitle title="Ближайшие публикации" /><div className="mobile-schedule-list"><Card><time>14:00<small>Сегодня</small></time><span><b>Еженедельный тред</b><small>@technova_team</small></span><i className="violet-dot" /></Card><Card><time>09:00<small>Завтра</small></time><span><b>Тизер запуска продукта</b><small>@TechStartup</small></span><i /></Card><Card><time>16:30<small>Чт</small></time><span><b>Вопросы сообщества</b><small>@LuminaBrand</small></span><i /></Card></div><button className="mobile-view-all" onClick={() => navigate('/app/calendar')}>Весь календарь →</button></section>
    <section><SectionTitle title="Живой мониторинг" /><Card className="mobile-monitor-card"><div className="feed-tabs"><Badge tone="blue">Упоминания</Badge><Badge>Ключевые слова</Badge><Badge>Тональность</Badge></div><article><span className="account-avatar">U</span><p><b>@User123 упомянул @TechNova</b>«Новые функции сегодня выглядят сильно!»<small>2 мин · позитивно</small></p></article><article><span className="account-avatar">D</span><p><b>@DesignCritique упомянул бренд</b>«Покажете последний кейс?»<small>15 мин · ответить с AI</small></p></article></Card></section>
  </div>
}
