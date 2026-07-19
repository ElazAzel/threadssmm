import { useState, type ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  Bell,
  CalendarDays,
  CheckSquare,
  CircleHelp,
  CreditCard,
  LayoutDashboard,
  Megaphone,
  Menu,
  MessageSquareReply,
  Plus,
  Search,
  Settings,
  Sparkles,
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
  { to: '/app/studio', label: 'Контент', icon: Sparkles },
  { to: '/app/calendar', label: 'Календарь', icon: CalendarDays },
  { to: '/app/analytics', label: 'Аналитика', icon: BarChart3 },
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
    '/app/studio': 'Контент',
    '/app/calendar': 'Календарь',
    '/app/analytics': 'Аналитика',
    '/app/settings': 'Настройки',
    '/app/accounts': 'Аккаунты',
    '/app/brands': 'Бренды',
    '/app/approvals': 'Согласования',
    '/app/engagement': 'Engagement',
    '/app/reply': 'Ответы',
    '/app/monitoring': 'Мониторинг',
    '/app/media': 'Медиатека',
    '/app/billing': 'Тариф и лимиты',
    '/app/audiences': 'Аудитории',
    '/app/locations': 'Локации',
    '/app/brand-profile': 'Профиль бренда',
  }
  const routeClass = `route-${location.pathname.split('/').pop()}`
  const normalizedSearch = search.trim().toLocaleLowerCase('ru-RU')
  const searchResults = normalizedSearch ? [
    ...brands.filter((item) => `${item.name} ${item.niche}`.toLocaleLowerCase('ru-RU').includes(normalizedSearch)).map((item) => ({ id: `brand-${item.id}`, label: item.name, meta: 'Профиль бренда', to: '/app/settings?section=brands' })),
    ...accounts.filter((item) => `${item.username} ${item.display_name}`.toLocaleLowerCase('ru-RU').includes(normalizedSearch)).map((item) => ({ id: `account-${item.id}`, label: `@${item.username}`, meta: 'Threads-аккаунт', to: '/app/settings?section=accounts' })),
    ...drafts.filter((item) => `${item.title} ${item.content}`.toLocaleLowerCase('ru-RU').includes(normalizedSearch)).slice(0, 5).map((item) => ({ id: `draft-${item.id}`, label: item.title || item.content.slice(0, 60), meta: 'Публикация', to: item.status === 'pending_approval' ? '/app/calendar' : '/app/calendar' })),
    ...monitorItems.filter((item) => `${item.title} ${item.summary}`.toLocaleLowerCase('ru-RU').includes(normalizedSearch)).slice(0, 5).map((item) => ({ id: `monitor-${item.id}`, label: item.title, meta: 'Мониторинг', to: '/app/calendar' })),
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
          <div className="brand-mark">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 2L2 7v5c0 5.5 3.8 10.7 10 12 6.2-1.3 10-6.5 10-12V7l-10-5z"/></svg>
          </div>
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
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} onClick={() => setMenuOpen(false)} end={to === '/app/dashboard'}>
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
          <div className="sidebar-divider" />
          <div className="sidebar-section-label">Быстрый доступ</div>
          <NavLink to="/app/approvals" onClick={() => setMenuOpen(false)} className="sidebar-extra-link">
            <Bell size={18} />
            <span>Согласования</span>
            {pendingApprovals.length ? <b>{pendingApprovals.length}</b> : null}
          </NavLink>
          <NavLink to="/app/monitoring" onClick={() => setMenuOpen(false)} className="sidebar-extra-link">
            <MessageSquareReply size={18} />
            <span>Мониторинг</span>
          </NavLink>
          <NavLink to="/app/billing" onClick={() => setMenuOpen(false)} className="sidebar-extra-link">
            <CreditCard size={18} />
            <span>Тариф и лимиты</span>
          </NavLink>
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
          <strong className="mobile-top-title">{mobileTitles[location.pathname] ?? 'Threads SMM Agent'}</strong>
          {title ? <strong className="topbar-title">{title}</strong> : null}
          <div className="global-search">
            <Search size={19} />
            <input aria-label="Ваш запрос" placeholder="Поиск..." value={search} onChange={(event) => setSearch(event.target.value)} />
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
        <NavLink to="/app/dashboard"><LayoutDashboard /><span>Обзор</span></NavLink>
        <NavLink to="/app/studio"><Sparkles /><span>Контент</span></NavLink>
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

      {notificationsOpen ? <Modal title="Уведомления" onClose={() => setNotificationsOpen(false)}><div className="notification-list">{pendingApprovals.length ? <button onClick={() => { navigate('/app/approvals'); setNotificationsOpen(false) }}><CheckSquare /><span><b>Материалы ждут согласования</b><small>{pendingApprovals.length} шт.</small></span></button> : null}{failedDrafts.length ? <button onClick={() => { navigate('/app/calendar'); setNotificationsOpen(false) }}><CalendarDays /><span><b>Ошибки публикации</b><small>{failedDrafts.length} шт.</small></span></button> : null}{problemAccounts.length ? <button onClick={() => { navigate('/app/settings?section=accounts'); setNotificationsOpen(false) }}><UsersRound /><span><b>Требуется переподключение аккаунта</b><small>{problemAccounts.length} шт.</small></span></button> : null}{!pendingApprovals.length && !failedDrafts.length && !problemAccounts.length ? <div className="empty-state compact"><Bell /><h3>Новых уведомлений нет</h3></div> : null}</div></Modal> : null}

      {updatesOpen ? <Modal title="Что нового" onClose={() => setUpdatesOpen(false)}><div className="updates-list"><article><span>18 июня 2026</span><h3>Надёжное ядро рабочих процессов</h3><p>Добавлены атомарные кредиты AI, транзакционные согласования, rate limit API и сохраняемые настройки.</p></article><article><span>19 июля 2026</span><h3>Упрощённый интерфейс</h3><p>Все настройки в одном месте, компактная навигация, адаптив под любые экраны.</p></article></div></Modal> : null}

      {notice ? <div className="toast" role="status">{notice}</div> : null}
    </div>
  )
}
