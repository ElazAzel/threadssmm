import { useState, type ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  Bell,
  Bot,
  CalendarDays,
  CheckSquare,
  CircleHelp,
  CreditCard,
  Image,
  LayoutDashboard,
  MapPin,
  Megaphone,
  Menu,
  MessageSquareReply,
  Plus,
  Search,
  Settings,
  Sparkles,
  Target,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react'
import { Button, Modal } from './ui'
import { useAuth } from '../contexts/AuthContext'
import { useWorkspace } from '../contexts/WorkspaceContext'
import type { ContentFormat } from '../lib/domain'

const navigation = [
  { to: '/app/dashboard', label: 'Обзор', icon: LayoutDashboard },
  { to: '/app/accounts', label: 'Аккаунты', icon: UsersRound },
  { to: '/app/brand-profile', label: 'Профиль бренда', icon: Bot },
  { to: '/app/studio', label: 'AI Studio', icon: Sparkles },
  { to: '/app/engagement', label: 'Engagement', icon: Target },
  { to: '/app/reply', label: 'Ответы', icon: MessageSquareReply },
  { to: '/app/audiences', label: 'Аудитории', icon: UsersRound },
  { to: '/app/locations', label: 'Локации', icon: MapPin },
  { to: '/app/calendar', label: 'Календарь', icon: CalendarDays },
  { to: '/app/monitoring', label: 'Мониторинг', icon: BarChart3 },
  { to: '/app/approvals', label: 'Согласование', icon: CheckSquare, count: 4 },
  { to: '/app/analytics', label: 'Аналитика', icon: BarChart3 },
  { to: '/app/media', label: 'Медиатека', icon: Image },
  { to: '/app/billing', label: 'Тариф и лимиты', icon: CreditCard },
  { to: '/app/settings', label: 'Настройки', icon: Settings },
]

export function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [draftFormat, setDraftFormat] = useState<ContentFormat>('post')
  const [savingDraft, setSavingDraft] = useState(false)
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [updatesOpen, setUpdatesOpen] = useState(false)
  const { signOut } = useAuth()
  const { workspace, approvals, accounts, brands, drafts, monitorItems, createQuickDraft, requestApproval } = useWorkspace()
  const navigate = useNavigate()
  const location = useLocation()
  const mobileTitles: Record<string, string> = {
    '/app/dashboard': 'Threads SMM Agent',
    '/app/accounts': 'Аккаунты',
    '/app/brand-profile': 'Профиль бренда',
    '/app/studio': 'AI Studio',
    '/app/engagement': 'Engagement Factory',
    '/app/reply': 'Ответы',
    '/app/audiences': 'Аудитории',
    '/app/locations': 'Локации',
    '/app/calendar': 'Календарь',
    '/app/monitoring': 'Мониторинг',
    '/app/approvals': 'Согласования',
    '/app/analytics': 'Аналитика',
    '/app/media': 'Медиатека',
    '/app/billing': 'Тариф и лимиты',
    '/app/settings': 'Настройки',
  }
  const routeClass = `route-${location.pathname.split('/').pop()}`
  const normalizedSearch = search.trim().toLocaleLowerCase('ru-RU')
  const searchResults = normalizedSearch ? [
    ...brands.filter((item) => `${item.name} ${item.niche}`.toLocaleLowerCase('ru-RU').includes(normalizedSearch)).map((item) => ({ id: `brand-${item.id}`, label: item.name, meta: 'Профиль бренда', to: '/app/brands' })),
    ...accounts.filter((item) => `${item.username} ${item.display_name}`.toLocaleLowerCase('ru-RU').includes(normalizedSearch)).map((item) => ({ id: `account-${item.id}`, label: `@${item.username}`, meta: 'Threads-аккаунт', to: '/app/accounts' })),
    ...drafts.filter((item) => `${item.title} ${item.content}`.toLocaleLowerCase('ru-RU').includes(normalizedSearch)).slice(0, 5).map((item) => ({ id: `draft-${item.id}`, label: item.title || item.content.slice(0, 60), meta: 'Публикация', to: item.status === 'pending_approval' ? '/app/approvals' : '/app/calendar' })),
    ...monitorItems.filter((item) => `${item.title} ${item.summary}`.toLocaleLowerCase('ru-RU').includes(normalizedSearch)).slice(0, 5).map((item) => ({ id: `monitor-${item.id}`, label: item.title, meta: 'Мониторинг', to: '/app/monitoring' })),
  ].slice(0, 10) : []
  const pendingApprovals = approvals.filter((item) => item.status === 'pending')
  const failedDrafts = drafts.filter((item) => item.status === 'failed')
  const problemAccounts = accounts.filter((item) => item.status === 'expired' || item.status === 'error')

  const saveQuickDraft = async () => {
    if (!draft.trim()) return
    setSavingDraft(true)
    try {
      const created = await createQuickDraft(draft, draftFormat)
      await requestApproval(created.id, 'Быстрый черновик')
      setCreateOpen(false)
      setDraft('')
      setNotice('Черновик создан и отправлен на согласование')
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : 'Не удалось создать черновик')
    } finally {
      setSavingDraft(false)
      window.setTimeout(() => setNotice(''), 3200)
    }
  }

  return (
    <div className={`app-shell ${routeClass}`}>
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="brand-lockup">
          <div className="brand-mark">✦</div>
          <div>
            <strong>Threads SMM</strong>
            <span>{workspace?.name ?? 'Workspace'}</span>
          </div>
          <button className="sidebar-close" onClick={() => setMenuOpen(false)} aria-label="Закрыть меню">
            <X size={20} />
          </button>
        </div>

        <Button className="sidebar-create" onClick={() => setCreateOpen(true)}>
          <Plus size={18} /> Создать пост
        </Button>

        <nav className="sidebar-nav" aria-label="Основная навигация">
          {navigation.map(({ to, label, icon: Icon, count }) => (
            <NavLink key={to} to={to} onClick={() => setMenuOpen(false)}>
              <Icon size={19} />
              <span>{label}</span>
              {(to === '/app/approvals' ? approvals.filter((item) => item.status === 'pending').length : count) ? <b>{to === '/app/approvals' ? approvals.filter((item) => item.status === 'pending').length : count}</b> : null}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <a href="mailto:support@threadssmm.app"><CircleHelp size={18} /> Поддержка</a>
          <button type="button" onClick={() => setUpdatesOpen(true)}><Megaphone size={18} /> Что нового</button>
        </div>
      </aside>

      {menuOpen ? <button className="sidebar-scrim" onClick={() => setMenuOpen(false)} aria-label="Закрыть меню" /> : null}

      <div className="app-stage">
        <header className="topbar">
          <button className="menu-button" onClick={() => setMenuOpen(true)} aria-label="Открыть меню"><Menu size={22} /></button>
          {title ? <strong className="topbar-title">{title}</strong> : null}
          <strong className="mobile-top-title">{mobileTitles[location.pathname] ?? 'Threads SMM Agent'}</strong>
          <div className="global-search">
            <Search size={19} />
            <input aria-label="Поиск" placeholder="Поиск по аккаунтам, постам, темам..." value={search} onChange={(event) => setSearch(event.target.value)} />
            {normalizedSearch ? <div className="global-search-results" role="listbox" aria-label="Результаты поиска">{searchResults.length ? searchResults.map((result) => <button key={result.id} type="button" onClick={() => { navigate(result.to); setSearch('') }}><span>{result.label}</span><small>{result.meta}</small></button>) : <p>Ничего не найдено</p>}</div> : null}
          </div>
          <button className="credits" onClick={() => navigate('/app/billing')}><Sparkles size={16} /> {workspace?.ai_credits ?? 0} кредитов</button>
          <button className="icon-button notification-button" aria-label="Уведомления" onClick={() => setNotificationsOpen(true)}><Bell size={20} />{pendingApprovals.length + failedDrafts.length + problemAccounts.length ? <i /> : null}</button>
          <button className="avatar-button" aria-label="Выйти" title="Выйти" onClick={() => void signOut().then(() => navigate('/login'))}><UserRound size={20} /></button>
          <Button className="topbar-create" onClick={() => setCreateOpen(true)}>Создать</Button>
        </header>
        <main className="app-content">{children}</main>
      </div>

      <nav className="mobile-nav" aria-label="Мобильная навигация">
        <NavLink to="/app/dashboard"><LayoutDashboard /><span>Главная</span></NavLink>
        <NavLink to="/app/studio"><Sparkles /><span>AI</span></NavLink>
        <NavLink to="/app/calendar"><CalendarDays /><span>Календарь</span></NavLink>
        <NavLink to="/app/approvals"><Bell /><span>События</span></NavLink>
        <NavLink to="/app/settings"><Settings /><span>Настройки</span></NavLink>
      </nav>

      {createOpen ? (
        <Modal title="Быстрый черновик" onClose={() => setCreateOpen(false)}>
          <div className="form-stack">
            <label>
              Тип публикации
              <select value={draftFormat} onChange={(event) => setDraftFormat(event.target.value as ContentFormat)}><option value="post">Пост</option><option value="thread">Тред</option><option value="reply">Ответ</option></select>
            </label>
            <label>
              Основная мысль
              <textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="О чём должен быть пост?" rows={5} autoFocus />
            </label>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setCreateOpen(false)}>Отмена</Button>
              <Button onClick={() => void saveQuickDraft()} disabled={!draft.trim() || savingDraft}>{savingDraft ? 'Сохраняем...' : 'Создать черновик'}</Button>
            </div>
          </div>
        </Modal>
      ) : null}

      {notificationsOpen ? <Modal title="Уведомления" onClose={() => setNotificationsOpen(false)}><div className="notification-list">{pendingApprovals.length ? <button onClick={() => { navigate('/app/approvals'); setNotificationsOpen(false) }}><CheckSquare /><span><b>Материалы ждут согласования</b><small>{pendingApprovals.length} шт.</small></span></button> : null}{failedDrafts.length ? <button onClick={() => { navigate('/app/calendar'); setNotificationsOpen(false) }}><CalendarDays /><span><b>Ошибки публикации</b><small>{failedDrafts.length} шт.</small></span></button> : null}{problemAccounts.length ? <button onClick={() => { navigate('/app/accounts'); setNotificationsOpen(false) }}><UsersRound /><span><b>Требуется переподключение аккаунта</b><small>{problemAccounts.length} шт.</small></span></button> : null}{!pendingApprovals.length && !failedDrafts.length && !problemAccounts.length ? <div className="empty-state compact"><Bell /><h3>Новых уведомлений нет</h3></div> : null}</div></Modal> : null}

      {updatesOpen ? <Modal title="Что нового" onClose={() => setUpdatesOpen(false)}><div className="updates-list"><article><span>18 июня 2026</span><h3>Надёжное ядро рабочих процессов</h3><p>Добавлены атомарные кредиты AI, транзакционные согласования, rate limit API и сохраняемые настройки.</p></article><article><span>17 июня 2026</span><h3>Диагностика production</h3><p>Экран настройки показывает, какие подключения готовы для запуска.</p></article></div></Modal> : null}

      {notice ? <div className="toast" role="status">{notice}</div> : null}
    </div>
  )
}
