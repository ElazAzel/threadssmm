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
  Megaphone,
  Menu,
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
  { to: '/app/accounts', label: 'Аккаунты', icon: UsersRound },
  { to: '/app/brands', label: 'Профили бренда', icon: Bot },
  { to: '/app/studio', label: 'AI Studio', icon: Sparkles },
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
  const { signOut } = useAuth()
  const { workspace, approvals, createQuickDraft, requestApproval } = useWorkspace()
  const navigate = useNavigate()
  const location = useLocation()
  const mobileTitles: Record<string, string> = {
    '/app/dashboard': 'Threads SMM Agent',
    '/app/accounts': 'Аккаунты',
    '/app/brands': 'Профиль бренда',
    '/app/studio': 'AI Studio',
    '/app/calendar': 'Календарь',
    '/app/monitoring': 'Мониторинг',
    '/app/approvals': 'Согласования',
    '/app/analytics': 'Аналитика',
    '/app/media': 'Медиатека',
    '/app/billing': 'Тариф и лимиты',
    '/app/settings': 'Настройки',
  }
  const routeClass = `route-${location.pathname.split('/').pop()}`

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
          <button type="button"><Megaphone size={18} /> Что нового</button>
        </div>
      </aside>

      {menuOpen ? <button className="sidebar-scrim" onClick={() => setMenuOpen(false)} aria-label="Закрыть меню" /> : null}

      <div className="app-stage">
        <header className="topbar">
          <button className="menu-button" onClick={() => setMenuOpen(true)} aria-label="Открыть меню"><Menu size={22} /></button>
          {title ? <strong className="topbar-title">{title}</strong> : null}
          <strong className="mobile-top-title">{mobileTitles[location.pathname] ?? 'Threads SMM Agent'}</strong>
          <label className="global-search">
            <Search size={19} />
            <input aria-label="Поиск" placeholder="Поиск по аккаунтам, постам, темам..." />
          </label>
          <button className="credits" onClick={() => navigate('/app/billing')}><Sparkles size={16} /> {workspace?.ai_credits ?? 0} кредитов</button>
          <button className="icon-button" aria-label="Уведомления"><Bell size={20} /></button>
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

      {notice ? <div className="toast" role="status">{notice}</div> : null}
    </div>
  )
}
