import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Bot, Check, CheckCircle2, ChevronRight, Clock3, Copy, Edit3, Filter, Lightbulb, Plus, Radar, RefreshCw, Sparkles, X } from 'lucide-react'
import { AppShell } from '../components/AppShell'
import { Badge, Button, Card, Progress, SectionTitle } from '../components/ui'

const calendarEvents = [
  { day: 2, title: 'Продуктовый дайджест', status: 'Опубликован', tone: 'green' as const, time: '09:00' },
  { day: 3, title: 'Q3: главные функции', status: 'Запланирован', tone: 'blue' as const, time: '14:30' },
  { day: 3, title: 'Контрарный взгляд на AI', status: 'Черновик', tone: 'orange' as const, time: '18:00' },
  { day: 4, title: 'Бэкстейдж команды', status: 'Идея', tone: 'neutral' as const, time: '—' },
]

export function CalendarPage() {
  const [mode, setMode] = useState('Месяц')
  const [selected, setSelected] = useState(calendarEvents[1])
  const [notice, setNotice] = useState('')

  return (
    <AppShell>
      <div className="calendar-toolbar"><h1>Июнь <span>2026</span></h1><div className="segmented">{['Список', 'Неделя', 'Месяц'].map((item) => <button key={item} className={mode === item ? 'active' : ''} onClick={() => setMode(item)}>{item}</button>)}</div><Button variant="secondary">Все бренды</Button><Button variant="secondary">Все аккаунты</Button><Button variant="secondary"><Filter size={17} /> Фильтр</Button></div>
      <div className="mobile-calendar-filters"><Button variant="secondary"><CalendarDaysIcon /> Июнь</Button><Button variant="secondary">Все бренды</Button><Button variant="secondary"><Filter size={16} /> Статус</Button></div>
      <div className="mobile-calendar-list"><span className="mono-label">Пн, 16 июня</span><Card className="mobile-calendar-event scheduled"><div><Clock3 /> 09:00 <Badge tone="blue">Запланирован</Badge></div><h2>Запуск маркетинговой кампании Q3</h2><p>Анонсирующий тред с видеоматериалами.</p><small>TechNova</small></Card><Card className="mobile-calendar-event draft"><div><Edit3 /> Время не задано <Badge>Черновик</Badge></div><h2>Идеи для бэкстейджа команды</h2><small>TechNova</small></Card><span className="mono-label">Вт, 17 июня</span><Card className="mobile-calendar-event review"><div><Clock3 /> 14:30 <Badge tone="orange">Согласование</Badge></div><h2>Обзор новых инструментов AI Studio</h2><small>Lumina Labs</small></Card><button className="mobile-fab" onClick={() => setNotice('Создан новый черновик')}>+</button></div>
      <div className="calendar-layout">
        <Card className="calendar-card"><div className="weekdays">{['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => <b key={day}>{day}</b>)}</div><div className="calendar-days">{Array.from({ length: 35 }, (_, index) => index + 1).map((day) => <div key={day} className={day === 15 ? 'today' : ''}><span>{day}</span>{calendarEvents.filter((event) => event.day === day).map((event) => <button key={event.title} className={`event event-${event.tone}`} onClick={() => setSelected(event)}><Badge tone={event.tone}>{event.status}</Badge><b>{event.title}</b><small>{event.time}</small></button>)}</div>)}</div></Card>
        <aside className="post-details"><div className="detail-head"><h2>Детали поста</h2><button><Edit3 size={18} /></button><button><X size={18} /></button></div><Badge tone={selected.tone}>{selected.status}</Badge><h2>{selected.title}</h2><p>@technova_team · {selected.time}</p><Card className="post-preview"><p>Мы выпустили три обновления аналитики: отслеживание вовлечённости в реальном времени, еженедельные отчёты и сравнение контент-пилларов.</p><p>Какой сценарий вы протестируете первым?</p></Card><Card className="compliance-box"><span><Sparkles /> AI Compliance <b>98% Safe</b></span><Progress value={98} tone="green" /><p>Тон соответствует правилам бренда. Чувствительных формулировок не найдено.</p></Card><div className="form-grid"><label>Дата<input type="date" defaultValue="2026-06-16" /></label><label>Время<input type="time" defaultValue="14:30" /></label></div><Button className="full-button" onClick={() => { setNotice('Изменения расписания сохранены'); window.setTimeout(() => setNotice(''), 2500) }}>Сохранить расписание</Button></aside>
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
  const [selected, setSelected] = useState(1)
  const [reply, setReply] = useState('')
  const item = streamItems[selected]

  return (
    <AppShell>
      <Card className="stream-head"><SectionTitle icon={<Radar />} title="Живые потоки" action={<div className="inline-form"><input placeholder="Ключевое слово, @user или RSS URL" /><Button variant="secondary"><Plus size={17} /> Добавить</Button></div>} /></Card>
      <div className="monitor-layout"><Card className="feed-list"><div className="feed-tabs"><Badge tone="blue">Все потоки</Badge><Badge>Упоминания</Badge><Badge>Конкуренты</Badge><Badge>Новости</Badge><Filter size={17} /></div>{streamItems.map((entry, index) => <button key={entry.source} className={`feed-item ${selected === index ? 'active' : ''}`} onClick={() => { setSelected(index); setReply('') }}><div><span><b>{entry.source}</b> · {entry.time}</span><span><Badge tone={entry.tone}>{entry.label}</Badge><Badge>Score: {entry.score}</Badge></span></div><p>{entry.title}</p><small>✦ {entry.sentiment} тональность</small></button>)}</Card>
        <div className="analysis-column"><Card className="analysis-card"><SectionTitle icon={<Sparkles />} title="Анализ сигнала" /><div className="analysis-block"><b>Почему это важно</b><p>Тема совпадает с текущей стратегией и позволяет быстро укрепить экспертную позицию до того, как конкуренты изменят повестку.</p></div><div className="analysis-block"><b><Lightbulb size={16} /> Предлагаемый угол</b><p>Покажите, как системный текстовый контент увеличивает удержание. Завершите вопросом о текущем процессе аудитории.</p></div><div className="risk-note"><AlertTriangle size={17} /> Риск: не звучать снисходительно. Сохраняйте объективный тон.</div><Button className="full-button" onClick={() => setReply(`Черновик ответа на сигнал от ${item.source}: системный текст работает не потому, что визуал не нужен, а потому что сильная мысль должна быть понятна без декора. Как вы измеряете удержание сейчас?`)}><Edit3 size={18} /> Создать ответ</Button></Card>{reply ? <Card className="reply-draft"><SectionTitle title="Черновик ответа" /><textarea rows={7} value={reply} onChange={(e) => setReply(e.target.value)} /><div className="split-actions"><Button variant="secondary"><Copy size={17} /> Копировать</Button><Button>Отправить на согласование</Button></div></Card> : null}<Card><h3 className="mono-label">Связанные темы</h3><div className="tag-editor"><button>Алгоритм</button><button>Text-first</button><button>Охват</button><button>Удержание</button></div></Card></div>
      </div>
    </AppShell>
  )
}

const approvalItems = [
  { id: 1, type: 'Тред', title: 'Анонс продуктовой версии 3.0', risk: 'Высокий риск', tone: 'red' as const, time: '10 мин назад' },
  { id: 2, type: 'Изменение бренда', title: 'Обновить ссылку в профиле', risk: 'Низкий риск', tone: 'green' as const, time: '1 час назад' },
  { id: 3, type: 'Пост', title: 'Еженедельный spotlight сообщества', risk: 'Средний риск', tone: 'orange' as const, time: '3 часа назад' },
]

export function ApprovalsPage() {
  const [selected, setSelected] = useState(0)
  const [risk, setRisk] = useState(78)
  const [approved, setApproved] = useState(false)
  const navigate = useNavigate()
  const item = approvalItems[selected]

  return (
    <AppShell>
      <div className="approval-layout"><aside className="approval-inbox"><div className="page-head compact-head"><h1>Входящие</h1><button className="icon-button"><Filter size={18} /></button></div><div className="segmented full"><button className="active">Все (12)</button><button>Риск (3)</button><button>Черновики</button></div>{approvalItems.map((entry, index) => <button key={entry.id} className={`approval-list-item ${selected === index ? 'active' : ''}`} onClick={() => { setSelected(index); setRisk(entry.tone === 'red' ? 78 : entry.tone === 'orange' ? 45 : 8); setApproved(false) }}><span><Badge>{entry.type}</Badge><small>{entry.time}</small></span><b>{entry.title}</b><em><Badge tone={entry.tone}>{entry.risk}</Badge></em></button>)}</aside>
        <Card className="approval-document"><div className="approval-doc-head"><div><h1>{item.title}</h1><p><Clock3 size={16} /> Сегодня, 14:00 · Автор: AI Agent Alpha</p></div><button className="icon-button"><Copy size={18} /></button><button className="icon-button"><RefreshCw size={18} /></button></div>
          {approved ? <div className="approval-success"><CheckCircle2 /><h2>Публикация согласована</h2><p>Материал добавлен в календарь на сегодня, 14:00.</p><Button onClick={() => navigate('/app/calendar')}>Открыть календарь <ChevronRight size={17} /></Button></div> : <div className="approval-body"><section><div className="preview-label"><span>Предпросмотр треда</span><button><Edit3 size={17} /> Редактировать</button></div><Card className="thread-post"><div className="post-author"><span>T</span><b>TechNova <small>@technova_team</small></b></div><p>Ожидание закончилось. Представляем Nexus v3. 🚀</p><p>Мы переписали ядро, ускорили ключевые операции на 40% и подготовили систему к корпоративной нагрузке.</p></Card><Card className="thread-post"><div className="post-author"><span>T</span><b>TechNova <small>@technova_team</small></b></div><p>1/ Безопасность: мы внедрили <mark>{risk > 50 ? 'шифрование военного уровня' : 'стандартное AES-256 шифрование'}</mark> для всех конечных точек.</p></Card></section><aside><Card className="risk-card"><span><AlertTriangle /> Compliance Risk</span><strong>{risk > 50 ? 'Высокий' : 'Низкий'} <b>{risk}%</b></strong><Progress value={risk} tone={risk > 50 ? 'orange' : 'green'} /><p>Токсичность: низкая<br />Спам: средний<br />Ложные утверждения: {risk > 50 ? 'высокий' : 'низкий'}</p></Card><Card className="reasoning"><h3><Bot size={17} /> AI Reasoning</h3><p>Фраза «шифрование военного уровня» отмечена юридическим правилом №42. Рекомендуем заменить её на проверяемую формулировку «AES-256».</p></Card></aside></div>}
          {!approved ? <div className="approval-actions"><Button variant="secondary">Отклонить</Button><Button variant="secondary" onClick={() => setRisk(8)}><Edit3 size={17} /> Исправить риск</Button><Button onClick={() => setApproved(true)}><Check size={17} /> Согласовать и запланировать</Button></div> : null}
        </Card></div>
    </AppShell>
  )
}
