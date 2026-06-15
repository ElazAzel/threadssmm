import { useState } from 'react'
import { AlertTriangle, BarChart3, Bell, Bot, Check, CheckCircle2, Copy, Download, Eye, FileText, Image as ImageIcon, KeyRound, Plus, Save, ShieldCheck, Sparkles, Trash2, Upload, Webhook } from 'lucide-react'
import { AppShell } from '../components/AppShell'
import { Badge, Button, Card, Progress, SectionTitle } from '../components/ui'
import { mediaAssets } from '../data'

export function AnalyticsPage() {
  const [period, setPeriod] = useState('30Д')
  const [notice, setNotice] = useState('')
  const bars = [38, 52, 34, 65, 47, 61, 86]
  return (
    <AppShell title="Обзор аналитики">
      <div className="analytics-toolbar"><div className="segmented">{['7Д', '30Д', '90Д', 'Год'].map((item) => <button key={item} className={period === item ? 'active' : ''} onClick={() => setPeriod(item)}>{item}</button>)}</div><Button variant="secondary" onClick={() => { setNotice('Отчёт подготовлен к экспорту'); window.setTimeout(() => setNotice(''), 2400) }}><Download size={17} /> Экспорт отчёта</Button></div>
      <div className="metric-grid analytics-metrics"><Card className="metric-card"><span>Всего постов <FileText /></span><strong>342 <small>↑12%</small></strong></Card><Card className="metric-card"><span>Вовлечённость <BarChart3 /></span><strong>4.8% <small>↑0.5%</small></strong></Card><Card className="metric-card"><span>Просмотры <Eye /></span><strong>1.2M <small className="negative">↓3%</small></strong></Card><Card className="metric-card"><span>AI-кредиты <Sparkles /></span><strong>850 <small>/1500</small></strong><Progress value={57} /></Card></div>
      <div className="analytics-layout"><div><Card className="chart-card"><SectionTitle title="Динамика вовлечённости" /><div className="bar-chart">{bars.map((height, index) => <span key={index} className={index === bars.length - 1 ? 'active' : ''} style={{ height: `${height}%` }} />)}</div></Card><div className="analytics-lower"><Card><SectionTitle title="Лучшие темы" />{[['AI-инструменты', 42], ['Дизайн-системы', 28], ['Рост агентства', 15]].map(([label, value]) => <div className="topic-progress" key={label as string}><span>{label}<b>{value}%</b></span><Progress value={value as number} tone={(value as number) > 35 ? 'violet' : 'blue'} /></div>)}</Card><Card><SectionTitle title="Контент-пиллары" /><div className="donut" /><div className="donut-legend"><span>Обучение</span><span>Продукт</span><span>Культура</span></div></Card></div></div><Card className="ai-insights"><SectionTitle icon={<Bot />} title="AI-выводы" /><div className="insight-note success"><b>Что сработало</b><p>Контрарные хуки в первых 50 символах увеличили удержание на 45%.</p></div><div className="insight-note danger"><b>Что не сработало</b><p>Промо-посты после 16:00 получили на 60% меньше органической видимости.</p></div><div className="insight-note next"><b>Что публиковать дальше</b><p>Сделайте серию из пяти коротких разборов и поставьте следующий продуктовый пост на 09:00.</p><Button>Создать черновики</Button></div></Card></div>
      <Card className="table-wrap"><SectionTitle title="Лучшие публикации" /><table><thead><tr><th>Публикация</th><th>Тема</th><th>Вовлечённость</th><th>Ответы</th><th>Статус</th></tr></thead><tbody><tr><td><b>Почему ваш контент-план не работает...</b><small>12 июня · 09:30</small></td><td>Стратегия</td><td>12.4%</td><td>428</td><td><Badge tone="green">Viral</Badge></td></tr><tr><td><b>Системность важнее мотивации...</b><small>9 июня · 14:15</small></td><td>Продуктивность</td><td>8.1%</td><td>156</td><td><Badge tone="blue">Good</Badge></td></tr><tr><td><b>AI не заменит агентство, но...</b><small>2 июня · 11:00</small></td><td>AI Trends</td><td>15.2%</td><td>892</td><td><Badge tone="green">Viral</Badge></td></tr></tbody></table></Card>
      {notice ? <div className="toast">{notice}</div> : null}
    </AppShell>
  )
}

export function MediaPage() {
  const [selected, setSelected] = useState(0)
  const [copied, setCopied] = useState(false)
  const asset = mediaAssets[selected]
  return (
    <AppShell>
      <div className="page-head"><div><h1>Медиатека</h1><p>Созданные AI-материалы и загруженные файлы.</p></div><div className="inline-form"><Button variant="secondary">Бренд: TechNova</Button><Button variant="secondary">Стиль: Cyberpunk</Button><Button><Upload size={17} /> Загрузить</Button></div></div>
      <div className="media-layout"><div className="media-grid">{mediaAssets.map((item, index) => <button key={item.id} className={`media-tile ${selected === index ? 'active' : ''} ${index === 0 ? 'media-featured' : ''}`} onClick={() => setSelected(index)}><img src={item.image} alt={item.title} /><span><Badge tone="blue">AI</Badge><b>{item.title}</b><small>{item.meta}</small></span></button>)}</div><aside className="asset-details"><h2>Детали материала</h2><img src={asset.image} alt={asset.title} /><h3>{asset.title}</h3><p>1024 × 1024 · 2.4 MB · PNG</p><dl><div><dt>Бренд</dt><dd>TechNova</dd></div><div><dt>Движок</dt><dd>Image model</dd></div><div><dt>Создано</dt><dd>15 июня 2026</dd></div></dl><Card className="prompt-box"><span>Промпт <button onClick={() => { navigator.clipboard?.writeText(asset.prompt); setCopied(true); window.setTimeout(() => setCopied(false), 2000) }}><Copy size={15} /> {copied ? 'Скопировано' : 'Копировать'}</button></span><p>{asset.prompt}</p></Card><Button className="full-button"><FileText size={17} /> Прикрепить к черновику</Button><div className="split-actions"><Button variant="secondary"><Sparkles size={17} /> Похожий</Button><Button variant="danger"><Trash2 size={17} /></Button></div></aside></div>
    </AppShell>
  )
}

const plans = [
  { name: 'Starter', price: '$19', text: 'Для соло-экспертов', features: ['1 профиль бренда', '100 AI-кредитов', 'Базовая аналитика'] },
  { name: 'Pro', price: '$49', text: 'Для профессиональных команд', features: ['5 профилей бренда', '1000 AI-кредитов', 'Согласование и отчёты'] },
  { name: 'Growth', price: '$99', text: 'Для агентств и растущих брендов', features: ['Безлимитные профили', '5000 AI-кредитов', 'Расширенный мониторинг'] },
]

export function BillingPage() {
  const [plan, setPlan] = useState('Pro')
  return (
    <AppShell title="Тариф и использование">
      <div className="usage-grid"><Card><span>Осталось AI-кредитов <Sparkles /></span><strong>650 <small>/1000</small></strong><Progress value={65} /><Button variant="secondary">Купить кредиты</Button></Card><Card><span>Текстовые токены <FileText /></span><strong className="violet-text">42k <small>/50k</small></strong><Progress value={84} tone="violet" /><p>Сброс через 12 дней</p></Card><Card><span>Генерации изображений <ImageIcon /></span><strong className="orange-text">12 <small>/50</small></strong><Progress value={24} tone="orange" /><p>Сброс через 12 дней</p></Card></div>
      <Card className="current-plan"><div><span className="mono-label">Текущая подписка</span><h2>{plan} Plan <Badge tone="blue">Активен</Badge></h2><p>{plans.find((item) => item.name === plan)?.price}/месяц · следующий платёж 15 июля 2026</p></div><div><Button variant="secondary">Счета</Button><Button variant="secondary">Управление подпиской</Button></div></Card>
      <h2 className="standalone-title">Доступные тарифы</h2><div className="plans-grid">{plans.map((item) => <Card key={item.name} className={plan === item.name ? 'active-plan' : ''}>{plan === item.name ? <Badge tone="blue">Текущий тариф</Badge> : null}<h2>{item.name}</h2><strong>{item.price}<small>/мес.</small></strong><p>{item.text}</p><ul>{item.features.map((feature) => <li key={feature}><Check size={17} /> {feature}</li>)}</ul><Button variant={plan === item.name ? 'secondary' : 'primary'} onClick={() => setPlan(item.name)}>{plan === item.name ? 'Текущий тариф' : `Выбрать ${item.name}`}</Button></Card>)}</div>
    </AppShell>
  )
}

export function SettingsPage() {
  const [tab, setTab] = useState(() => window.matchMedia('(max-width: 720px)').matches ? 'Workspace' : 'Threads API')
  const [secretVisible, setSecretVisible] = useState(false)
  const [saved, setSaved] = useState(false)
  const tabs = ['Workspace', 'Безопасность', 'AI-провайдеры', 'Threads API', 'Уведомления', 'Аудит']
  return (
    <AppShell>
      <div className="page-head"><div><h1>Настройки workspace</h1><p>Административные параметры, API-интеграции и политики безопасности.</p></div></div><div className="tabs settings-tabs">{tabs.map((item) => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>)}</div>
      {tab === 'Threads API' ? <div className="settings-layout"><div><Card className="integration-card"><div className="integration-title"><div><h2>Интеграция Threads</h2><p>Meta App для публикации и чтения доступных данных.</p></div><Badge tone="green">API Healthy</Badge></div><label>Meta App ID<div className="input-action"><input defaultValue="84930211847392" /><button><Copy size={18} /></button></div></label><label>App Secret<div className="input-action"><input type={secretVisible ? 'text' : 'password'} placeholder="Секрет хранится только на сервере" autoComplete="new-password" /><button onClick={() => setSecretVisible(!secretVisible)}><Eye size={18} /></button></div></label><label>Redirect URI<div className="input-action"><input defaultValue="https://app.threadssmm.com/auth/meta/callback" /><button><Copy size={18} /></button></div></label><div className="integration-actions"><Button variant="secondary"><KeyRound size={17} /> Ротация ключей</Button><Button onClick={() => { setSaved(true); window.setTimeout(() => setSaved(false), 2300) }}><Save size={17} /> Сохранить</Button></div></Card><Card><SectionTitle title="Webhooks" action={<Button variant="secondary"><Plus size={16} /> Endpoint</Button>} /><div className="webhook-row"><Webhook /><span><b>Production Events <Badge tone="blue">Active</Badge></b><code>https://api.threadssmm.com/v1/webhooks/meta</code></span><button><Trash2 size={17} /></button></div></Card></div><div><Card><SectionTitle title="Использование API" /><div className="topic-progress"><span>Публикации <b>45 / 250</b></span><Progress value={18} /></div><div className="topic-progress"><span>Чтение <b>1.2k / 10k</b></span><Progress value={12} tone="green" /></div></Card><Card><SectionTitle title="Статус Meta" /><div className="meta-status"><CheckCircle2 /><div><b>Подключено</b><p>Синхронизация 2 минуты назад. Токен истекает через 45 дней.</p></div></div></Card></div></div> : <SettingsTab tab={tab} />}
      <Card className="audit-table table-wrap"><SectionTitle title="Последние события аудита" action={<Button variant="secondary"><Download size={16} /> CSV</Button>} /><table><thead><tr><th>Время</th><th>Кто</th><th>Действие</th><th>Ресурс</th><th>Риск</th></tr></thead><tbody><tr><td>15 июня, 12:32</td><td>System</td><td>Token Refresh</td><td><code>oauth/access_token</code></td><td><Badge tone="green">Успех</Badge></td></tr><tr><td>15 июня, 11:15</td><td>Sarah J.</td><td>Webhook обновлён</td><td><code>api/settings/webhook</code></td><td><Badge tone="orange">Повышенный</Badge></td></tr><tr><td>14 июня, 18:09</td><td>Mike T.</td><td>Неудачный вход</td><td><code>oauth/authorize</code></td><td><Badge tone="red">Высокий</Badge></td></tr></tbody></table></Card>
      {saved ? <div className="toast">Настройки интеграции сохранены</div> : null}
    </AppShell>
  )
}

function SettingsTab({ tab }: { tab: string }) {
  if (tab === 'Workspace') {
    return <div className="mobile-workspace-settings"><Card className="general-info"><h2>Основные данные</h2><label>Название workspace<input defaultValue="Threads SMM Pro" /></label><label>Часовой пояс<select><option>UTC — Всемирное координированное время</option><option>Asia/Qyzylorda</option></select></label><div><button className="text-button">Отменить изменения</button><Button>Сохранить</Button></div></Card><div className="activity-title"><h2>Последняя активность</h2><button className="text-button">Все →</button></div>{[['Новый вход с неизвестного устройства', 'Chrome · 2 минуты назад', 'Внимание'], ['Обновлён часовой пояс', 'Изменено администратором · 1 час назад', 'Инфо'], ['API-ключ отозван', 'Prod_Services_Alpha · вчера', 'Критично']].map(([title, text, status], index) => <Card className="activity-card" key={title}><span>{index + 1}</span><div><h3>{title}</h3><p>{text}</p></div><Badge tone={index === 1 ? 'blue' : index === 2 ? 'red' : 'orange'}>{status}</Badge></Card>)}</div>
  }
  const blocks: Record<string, { icon: typeof ShieldCheck; title: string; text: string }> = {
    'Безопасность': { icon: ShieldCheck, title: 'Политики безопасности', text: 'Сессии, двухфакторная аутентификация, журнал действий и ротация ключей.' },
    'AI-провайдеры': { icon: Bot, title: 'AI-провайдеры', text: 'Модели по умолчанию, лимиты стоимости и зашифрованные пользовательские ключи.' },
    'Уведомления': { icon: Bell, title: 'Уведомления', text: 'Согласования, ошибки публикации, лимиты кредитов и критические риски.' },
    'Аудит': { icon: AlertTriangle, title: 'Аудит и compliance', text: 'Период хранения событий, экспорт и правила высокого риска.' },
  }
  const item = blocks[tab]
  const Icon = item.icon
  return <Card className="settings-placeholder"><Icon /><div><h2>{item.title}</h2><p>{item.text}</p><label className="switch-row"><span>Включить рекомендуемые настройки</span><input type="checkbox" defaultChecked /></label><label>Основная политика<select><option>Стандартная</option><option>Строгая</option><option>Пользовательская</option></select></label><Button>Сохранить</Button></div></Card>
}
