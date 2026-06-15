import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bot, Check, CircleAlert, Copy, ExternalLink, Globe2, History, Link2, Plus, RefreshCw, Save, SlidersHorizontal, Sparkles, Upload } from 'lucide-react'
import { AppShell } from '../components/AppShell'
import { Badge, Button, Card, Progress, SectionTitle } from '../components/ui'
import { accounts, variants } from '../data'

export function AccountsPage() {
  const [selected, setSelected] = useState(0)
  const [notice, setNotice] = useState('')
  const account = accounts[selected]

  const action = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2800)
  }

  return (
    <AppShell>
      <div className="page-head"><div><h1>Подключённые аккаунты</h1><p>OAuth-подключения, разрешения и маршрутизация управляемых Threads-профилей.</p></div><Button onClick={() => action('Открыт безопасный OAuth-процесс Meta')}><Link2 size={18} /> Подключить аккаунт</Button></div>
      <Card className="api-notice"><CircleAlert /><div><h3>Ограничения официального API</h3><p>Некоторые действия недоступны через Threads API. Используйте безопасный fallback: создайте черновик, скопируйте текст или откройте Threads вручную.</p></div></Card>
      <div className="mobile-account-list"><Button onClick={() => action('Открыт безопасный OAuth-процесс Meta')}><Link2 size={18} /> Подключить новый аккаунт</Button>{accounts.map((item, index) => <Card key={item.id} onClick={() => setSelected(index)}><div><span className="account-avatar">{item.handle.slice(1, 2).toUpperCase()}</span><span><b>{item.handle}</b><small>{item.group}</small></span><Badge tone={item.tone}>{item.status}</Badge></div><footer><span>{item.tone === 'red' ? 'Требуется повторная авторизация' : 'Синхронизация 2 минуты назад'}</span><b>›</b></footer></Card>)}</div>
      <div className="accounts-layout">
        <Card className="accounts-table">
          <SectionTitle title="Активные подключения" action={<button className="icon-button" onClick={() => action('Статусы синхронизированы')}><RefreshCw size={18} /></button>} />
          <div className="table-wrap"><table><thead><tr><th>Аккаунт</th><th>Группа бренда</th><th>Статус</th><th /></tr></thead><tbody>{accounts.map((item, index) => <tr key={item.id} className={selected === index ? 'selected-row' : ''} onClick={() => setSelected(index)}><td><span className="account-avatar">{item.handle.slice(1, 2).toUpperCase()}</span><b>{item.handle}<small>ID: {item.id}</small></b></td><td>{item.group}</td><td><Badge tone={item.tone}>{item.status}</Badge></td><td>•••</td></tr>)}</tbody></table></div>
        </Card>
        <Card className="account-detail">
          <div className="account-hero"><span className="account-avatar large">{account.handle.slice(1, 2).toUpperCase()}</span><div><h2>{account.handle}</h2><p>ID: {account.id}</p></div></div>
          <h3 className="mono-label">OAuth статус</h3><div className="status-box"><Check size={18} /><b>{selected === 2 ? 'Нужно переподключение' : 'Токен действителен'}</b><span>{selected === 2 ? 'Истёк' : 'Ещё 42 дня'}</span></div>
          <h3 className="mono-label">Разрешения</h3><div className="permission-list"><code>threads_basic</code><code>threads_content_publish</code><code>threads_read_replies</code></div>
          <h3 className="mono-label">Здоровье API <span>85%</span></h3><Progress value={85} /><p className="centered-note">38/250 вызовов осталось · сброс через 12 мин</p>
          <div className="split-actions"><Button variant="secondary" onClick={() => action('Синхронизация запущена')}><RefreshCw size={17} /> Синхронизировать</Button><Button variant="secondary" onClick={() => action('Открыт OAuth для переподключения')}><ExternalLink size={17} /> Переподключить</Button></div>
        </Card>
      </div>
      {notice ? <div className="toast">{notice}</div> : null}
    </AppShell>
  )
}

const profiles = [
  { name: 'TechNova Inc.', niche: 'B2B SaaS / Developer Tools' },
  { name: 'Lumina Coffee', niche: 'D2C E-commerce / Lifestyle' },
  { name: 'Apex Fitness', niche: 'Local Business / Services' },
]

export function BrandsPage() {
  const [profile, setProfile] = useState(0)
  const [tab, setTab] = useState('Обзор')
  const [saved, setSaved] = useState(false)
  const current = profiles[profile]
  const tabs = ['Обзор', 'Голос и тон', 'Аудитория', 'Правила', 'Контент-пиллары']

  return (
    <AppShell>
      <div className="brand-editor">
        <aside className="profile-rail"><div className="rail-title"><h2>Профили бренда</h2><button><Plus size={19} /></button></div><input placeholder="Фильтр профилей..." />{profiles.map((item, index) => <button key={item.name} className={profile === index ? 'active' : ''} onClick={() => setProfile(index)}><b>{item.name}</b><span>{item.niche}</span></button>)}</aside>
        <section className="profile-main">
          <div className="profile-head"><div className="brand-symbol"><Bot /></div><div><h1>{current.name}</h1><p><Badge>B2B SaaS</Badge> Обновлено 2 часа назад</p></div><div className="profile-actions"><Button variant="secondary"><History size={17} /> История</Button><Button onClick={() => { setSaved(true); window.setTimeout(() => setSaved(false), 2500) }}><Save size={17} /> Сохранить</Button></div></div>
          <div className="tabs">{tabs.map((item) => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>)}</div>
          {tab === 'Обзор' ? <div className="profile-overview"><Card className="identity-card"><SectionTitle icon={<Globe2 />} title="Основа бренда" /><div className="form-grid"><label>Название<input defaultValue={current.name} /></label><label>Ниша<input defaultValue={current.niche} /></label><label className="full">Уникальное ценностное предложение<textarea rows={3} defaultValue="AI-платформа, которая сокращает время настройки инфраструктуры на 80% без потери надёжности." /></label></div></Card><Card className="goal-card"><SectionTitle title="Главные цели" /><ol><li>Рост регистраций разработчиков</li><li>Техническая экспертность</li></ol><button>+ Добавить цель</button></Card><Card className="extract-card"><div><SectionTitle icon={<Sparkles />} title="AI-извлечение профиля" /><p>Вставьте URL или текст, чтобы заполнить голос, аудиторию и контент-пиллары.</p></div><input placeholder="https://technova.io/about" /><Button variant="secondary"><Upload size={17} /> PDF</Button><Button><Sparkles size={17} /> Извлечь</Button></Card></div> : <ProfileTab name={tab} />}
        </section>
      </div>
      {saved ? <div className="toast">Профиль бренда сохранён</div> : null}
    </AppShell>
  )
}

function ProfileTab({ name }: { name: string }) {
  const content: Record<string, { title: string; text: string; options: string[] }> = {
    'Голос и тон': { title: 'Голос бренда', text: 'Технический, уверенный и конкретный. Без канцелярита, пустых обещаний и избыточных эмодзи.', options: ['Уверенный', 'Практичный', 'Прямой', 'Дружелюбный'] },
    'Аудитория': { title: 'Целевая аудитория', text: 'CTO, engineering leads, senior-разработчики и продуктовые команды технологических компаний.', options: ['B2B SaaS', '20–500 сотрудников', 'СНГ + Европа', 'Технические роли'] },
    'Правила': { title: 'Правила и ограничения', text: 'Не использовать неподтверждённые цифры, агрессивные сравнения и обещания абсолютной безопасности.', options: ['Без политики', 'Без кликбейта', 'Только проверяемые данные', 'Approval обязателен'] },
    'Контент-пиллары': { title: 'Контент-пиллары', text: 'Темы, которые поддерживают позиционирование и дают агенту устойчивую структуру контент-плана.', options: ['AI-инфраструктура', 'Developer Experience', 'Разборы систем', 'Продуктовые обновления'] },
  }
  const item = content[name]
  return <Card className="single-tab-card"><h2>{item.title}</h2><p>{item.text}</p><div className="tag-editor">{item.options.map((option) => <button key={option}>{option} <span>×</span></button>)}<button className="add-tag">+ Добавить</button></div><textarea rows={6} defaultValue={item.text} /><Button>Сохранить изменения</Button></Card>
}

export function StudioPage() {
  const [type, setType] = useState('Пост')
  const [prompt, setPrompt] = useState('')
  const [generated, setGenerated] = useState(true)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState('B')
  const [notice, setNotice] = useState('')
  const navigate = useNavigate()

  const generate = () => {
    setLoading(true)
    window.setTimeout(() => { setGenerated(true); setLoading(false); setNotice('Созданы 3 варианта в голосе бренда'); window.setTimeout(() => setNotice(''), 2500) }, 700)
  }

  const sendApproval = () => {
    setNotice(`Вариант ${selected} отправлен на согласование`)
    window.setTimeout(() => navigate('/app/approvals'), 800)
  }

  return (
    <AppShell>
      <div className="studio-layout">
        <div className="mobile-studio-intro"><h1>AI Studio</h1><p>Настройте и создайте несколько сильных вариантов контента.</p></div>
        <Card className="mobile-studio-config"><SectionTitle title="Настройки генерации" /><span className="field-label">Тон</span><div className="tone-options"><button className="active">Профессиональный</button><button>Вовлекающий</button><button>Экспертный</button></div><div className="form-grid"><label>Длина<select><option>Короткий пост</option><option>Средний пост</option></select></label><label>Хэштеги<select><option>Минимально (1–2)</option><option>Без хэштегов</option></select></label></div></Card>
        <div className="studio-config">
          <Card><SectionTitle icon={<SlidersHorizontal />} title="Настройки генерации" /><label>Workspace<select><option>TechNova Growth</option></select></label><label>Персона бренда<select><option>Технический эксперт</option></select></label><div className="form-grid compact"><label>Язык<select><option>Русский</option><option>English</option></select></label><label>Модель<select><option>GPT-4.1</option><option>Claude Sonnet</option></select></label></div><span className="field-label">Формат</span><div className="segmented full">{['Пост', 'Тред', 'Ответ'].map((item) => <button key={item} className={type === item ? 'active' : ''} onClick={() => setType(item)}>{item}</button>)}</div><span className="field-label">Допустимый риск</span><input type="range" min="0" max="100" defaultValue="45" /><div className="range-labels"><span>Безопасно</span><span>Смело</span></div></Card>
          <Card><SectionTitle icon={<Bot />} title="Контекст" /><label>Основная мысль<textarea rows={9} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Например: объяснить, почему системный контент сильнее случайных вирусных постов" /></label><label>Цель аудитории<input placeholder="Получить ответы и переходы" /></label><Button className="full-button" onClick={generate} disabled={loading}><Sparkles size={18} /> {loading ? 'Генерируем...' : 'Создать варианты'}</Button></Card>
        </div>

        <section className="studio-results"><div className="page-head compact-head"><div><h1>Варианты публикации</h1><p>Проверьте смысл, риски и голос бренда перед согласованием.</p></div><Button variant="secondary"><History size={17} /> История</Button></div>
          {generated ? <div className="variant-grid">{variants.map((item) => <Card key={item.id} className={`variant-card ${selected === item.id ? 'selected' : ''}`} onClick={() => setSelected(item.id)}><div className="variant-top"><Badge>Вариант {item.id}</Badge><Badge tone={item.badge}>{item.tone}</Badge><button aria-label="Скопировать"><Copy size={17} /></button></div><p className="variant-copy">{item.text}</p><div className="variant-scores"><span><small>Hook score</small><b>{item.score}</b></span><span><small>Compliance</small><b>{item.compliance}</b></span></div><div className="split-actions"><Button variant="secondary">Сохранить</Button><Button onClick={(e) => { e.stopPropagation(); setSelected(item.id); sendApproval() }}>Согласовать</Button></div></Card>)}</div> : null}
          <Card className="visual-assets"><div><SectionTitle title="Визуальные материалы" /><label>Визуальный стиль<select><option>Technical Dark</option><option>Editorial Minimal</option><option>Brand Gradient</option></select></label></div><div className="visual-options"><button>{'{ }'}<span>Абстракция</span></button><button className="active">◒<span>3D-концепт</span></button><button>⌘<span>Интерфейс</span></button><button><Upload /><span>Загрузить</span></button></div></Card>
        </section>
      </div>
      {notice ? <div className="toast">{notice}</div> : null}
    </AppShell>
  )
}
