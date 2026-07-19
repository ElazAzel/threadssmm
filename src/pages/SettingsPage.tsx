import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Bot, CheckCircle2, ChevronDown, ChevronRight, Copy, Download, Globe,
  KeyRound, Mail, Plus, Sparkles, Trash2, UserPlus,
} from 'lucide-react'
import { AppShell } from '../components/AppShell'
import { Badge, Button, Card, Modal, SectionTitle } from '../components/ui'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { PLANS, TOKEN_PACKS } from '../lib/pricing'
import { AI_MODELS } from '../lib/ai-models'

function AccordionSection({ title, defaultOpen, children }: { id: string; title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen ?? false)
  return (
    <Card className="settings-section">
      <button className="settings-section-header" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>{title}</span>
        {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
      </button>
      {open ? <div className="settings-section-body">{children}</div> : null}
    </Card>
  )
}

export function SettingsPage() {
  const { workspace, accounts, brands, auditLogs, teamMembers, updateWorkspace, saveWorkspaceSettings, workspaceSettings,
    createBrand, deleteBrand, addManualAccount, deleteAccount, inviteTeamMember, removeTeamMember, updateTeamMemberRole } = useWorkspace()
  const [searchParams] = useSearchParams()
  const sectionFromUrl = searchParams.get('section')
  const [openSection] = useState<string | null>(sectionFromUrl ?? 'workspace')

  const activeAccount = accounts.find((account) => account.status === 'active')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'editor' | 'viewer'>('editor')

  const [workspaceName, setWorkspaceName] = useState(workspace?.name ?? '')
  const [workspaceRegion, setWorkspaceRegion] = useState(workspace?.region ?? 'СНГ')
  const [showNewBrand, setShowNewBrand] = useState(false)
  const [newBrandName, setNewBrandName] = useState('')
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [newAccountUsername, setNewAccountUsername] = useState('')

  const handleSaveWorkspace = async () => {
    if (workspaceName.trim()) await updateWorkspace({ name: workspaceName, region: workspaceRegion })
  }

  const handleInvite = async () => {
    if (inviteEmail.trim()) {
      await inviteTeamMember(inviteEmail, inviteRole)
      setInviteEmail('')
    }
  }

  return (
    <AppShell>
      <div className="page-head">
        <div>
          <h1>Настройки</h1>
          <p>Всё управление в одном месте — настройте один раз и пользуйтесь.</p>
        </div>
      </div>

      <div className="settings-container">
        {/* Workspace */}
        <AccordionSection id="workspace" title="Рабочее пространство" defaultOpen={openSection === 'workspace'}>
          <div className="form-grid compact">
            <label>Название
              <input value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} placeholder="Название workspace" />
            </label>
            <label>Регион
              <select value={workspaceRegion} onChange={(e) => setWorkspaceRegion(e.target.value)}>
                <option>СНГ</option><option>Европа</option><option>Глобально</option>
              </select>
            </label>
          </div>
          <div className="settings-actions"><Button onClick={() => void handleSaveWorkspace()}>Сохранить</Button></div>
        </AccordionSection>

        {/* Accounts */}
        <AccordionSection id="accounts" title="Аккаунты Threads" defaultOpen={openSection === 'accounts'}>
          {accounts.length ? <div className="settings-account-list">{accounts.map((account) => (
            <div key={account.id} className="settings-account-row">
              <div className="account-avatar">{account.username[0]?.toUpperCase() ?? '?'}</div>
              <div><b>@{account.username}</b>{account.display_name ? <small>{account.display_name}</small> : null}<Badge tone={account.status === 'active' ? 'green' : account.status === 'expired' ? 'orange' : 'default'}>{account.status}</Badge></div>
              <button className="icon-button" onClick={() => { if (confirm('Удалить аккаунт?')) deleteAccount(account.id) }} aria-label="Удалить аккаунт"><Trash2 size={16} /></button>
            </div>
          ))}</div> : <p className="settings-empty">Аккаунты не добавлены. Подключите Threads через OAuth или добавьте вручную.</p>}
          <div className="settings-actions">
            <Button variant="secondary" onClick={() => setShowAddAccount(true)}><Plus size={16} /> Добавить аккаунт</Button>
          </div>

          {/* OAuth section */}
          <Card className="settings-integration-card">
            <div className="integration-header">
              <KeyRound size={20} />
              <div><b>Интеграция Threads API</b><p>Переменные задаются в Vercel, не отправляются из браузера.</p></div>
              <Badge tone={activeAccount ? 'green' : 'orange'}>{activeAccount ? 'OAuth подключён' : 'Нужна настройка'}</Badge>
            </div>
            <div className="settings-env-list">
              {['THREADS_APP_ID', 'THREADS_APP_SECRET', 'THREADS_REDIRECT_URI', 'TOKEN_ENCRYPTION_KEY', 'CRON_SECRET'].map((env) => (
                <div key={env} className="settings-env-row">
                  <code>{env}</code>
                  <button onClick={() => void navigator.clipboard.writeText(env)} aria-label={`Копировать ${env}`}><Copy size={14} /></button>
                </div>
              ))}
            </div>
          </Card>
        </AccordionSection>

        {/* Brands */}
        <AccordionSection id="brands" title="Бренды" defaultOpen={openSection === 'brands'}>
          {brands.length ? <div className="settings-brand-list">{brands.map((brand) => (
            <div key={brand.id} className="settings-brand-row">
              <Bot size={20} />
              <div><b>{brand.name}</b>{brand.niche ? <small>{brand.niche}</small> : null}</div>
              <button className="icon-button" onClick={() => { if (confirm('Удалить бренд?')) deleteBrand(brand.id) }} aria-label="Удалить бренд"><Trash2 size={16} /></button>
            </div>
          ))}</div> : <p className="settings-empty">Бренды не созданы.</p>}
          <div className="settings-actions">
            {showNewBrand ? <div className="inline-form"><input value={newBrandName} onChange={(e) => setNewBrandName(e.target.value)} placeholder="Название бренда" /><Button onClick={async () => { if (newBrandName.trim()) { await createBrand(newBrandName.trim()); setNewBrandName(''); setShowNewBrand(false) } }}>Создать</Button><Button variant="ghost" onClick={() => setShowNewBrand(false)}>Отмена</Button></div> : <Button variant="secondary" onClick={() => setShowNewBrand(true)}><Plus size={16} /> Создать бренд</Button>}
          </div>
        </AccordionSection>

        {/* Team */}
        <AccordionSection id="team" title="Команда" defaultOpen={openSection === 'team'}>
          {teamMembers.length ? <div className="settings-team-list">{teamMembers.map((member) => (
            <div key={member.id} className="settings-team-row">
              <div className="account-avatar">{member.name?.[0] ?? member.email[0]?.toUpperCase() ?? '?'}</div>
              <div><b>{member.name || member.email}</b><small>{member.email}</small></div>
              <select value={member.role} onChange={(e) => updateTeamMemberRole(member.id, e.target.value as 'admin' | 'editor' | 'viewer')} className="settings-role-select">
                <option value="admin">Админ</option><option value="editor">Редактор</option><option value="viewer">Зритель</option>
              </select>
              <button className="icon-button" onClick={() => { if (confirm('Удалить участника?')) removeTeamMember(member.id) }} aria-label="Удалить участника"><Trash2 size={16} /></button>
            </div>
          ))}</div> : <p className="settings-empty">Участников нет.</p>}
          <div className="settings-actions">
            <div className="inline-form">
              <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="Email участника" type="email" />
              <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as 'admin' | 'editor' | 'viewer')}>
                <option value="admin">Админ</option><option value="editor">Редактор</option><option value="viewer">Зритель</option>
              </select>
              <Button onClick={() => void handleInvite()} disabled={!inviteEmail.trim()}><UserPlus size={16} /> Пригласить</Button>
            </div>
          </div>
        </AccordionSection>

        {/* AI & Models */}
        <AccordionSection id="ai" title="AI и модели" defaultOpen={openSection === 'ai'}>
          <div className="settings-ai-info">
            <p>Подключено {AI_MODELS.length} моделей AI. Генерация использует выбранную модель в AI Studio.</p>
            <div className="settings-models-grid">{AI_MODELS.slice(0, 6).map((model) => (
              <div key={model.id} className="settings-model-card"><Sparkles size={16} /><div><b>{model.label}</b><small>{model.provider}</small></div><Badge>{model.tier}</Badge></div>
            ))}</div>
          </div>
        </AccordionSection>

        {/* Billing & Credits */}
        <AccordionSection id="billing" title="Тариф и лимиты" defaultOpen={openSection === 'billing'}>
          <div className="settings-plans-grid">{PLANS.map((plan) => (
            <Card key={plan.id} className={`settings-plan-card ${plan.id === 'pro' ? 'pricing-featured' : ''}`}>
              {plan.id === 'pro' ? <span className="pricing-badge">Популярный</span> : null}
              <h3>{plan.name}</h3>
              <div className="pricing-price">{plan.price}<small>/мес</small></div>
              <p className="pricing-desc">{plan.tokensPerMonth} кредитов/мес</p>
              <ul>{plan.features.map((feature) => <li key={feature}><CheckCircle2 size={14} /> {feature}</li>)}</ul>
              <Button variant={plan.id === 'pro' ? 'primary' : 'secondary'} className="full-button">Выбрать</Button>
            </Card>
          ))}</div>
          <div className="settings-token-packs"><SectionTitle title="Купить кредиты AI" /><div className="settings-token-grid">{TOKEN_PACKS.map((pack) => (
            <Button key={pack.id} variant="secondary" onClick={() => {}}><Sparkles size={16} /> {pack.tokens} кредитов — ${pack.price}</Button>
          ))}</div></div>
        </AccordionSection>

        {/* Integrations */}
        <AccordionSection id="integrations" title="Интеграции" defaultOpen={openSection === 'integrations'}>
          <div className="settings-integrations">
            <Card className="settings-int-card">
              <div className="integration-header">
                <Globe size={20} />
                <div><b>RSS мониторинг</b><p>Отслеживайте упоминания и новости по RSS-лентам.</p></div>
              </div>
            </Card>
            <Card className="settings-int-card">
              <div className="integration-header">
                <Mail size={20} />
                <div><b>Email уведомления</b><p>Настраивается в разделе команды.</p></div>
              </div>
            </Card>
          </div>
        </AccordionSection>

        {/* Security & Audit */}
        <AccordionSection id="security" title="Безопасность и аудит" defaultOpen={openSection === 'security'}>
          {workspaceSettings ? <div className="settings-toggles">
            {[
              { key: 'security_enabled', label: 'Безопасность', desc: 'Принудительная проверка контента перед публикацией' },
              { key: 'ai_enabled', label: 'AI-генерация', desc: 'Разрешить AI-генерацию контента' },
              { key: 'notifications_enabled', label: 'Уведомления', desc: 'Получать уведомления о событиях' },
              { key: 'audit_enabled', label: 'Аудит действий', desc: 'Логировать все действия в workspace' },
            ].map(({ key, label, desc }) => (
              <label key={key} className="settings-toggle-row">
                <div><b>{label}</b><small>{desc}</small></div>
                <label className="switch">
                  <input type="checkbox" className="switch-input" checked={!!workspaceSettings[key as keyof typeof workspaceSettings]} onChange={(e) => saveWorkspaceSettings({ [key]: e.target.checked })} />
                  <span className="switch-track"><span className="switch-thumb" /></span>
                </label>
              </label>
            ))}
          </div> : null}
          <div className="settings-audit-section">
            <SectionTitle title="Журнал аудита" action={<Button variant="secondary" disabled={!auditLogs.length} onClick={() => {
              const rows = [['Время', 'Пользователь', 'Действие', 'Ресурс'], ...auditLogs.map((entry) => [entry.created_at, entry.actor_id ?? 'system', entry.action, entry.resource_type])]
              const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n')
              const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }))
              const anchor = document.createElement('a')
              anchor.href = url; anchor.download = 'audit.csv'; anchor.click(); URL.revokeObjectURL(url)
            }}><Download size={16} /> CSV</Button>} />
            {auditLogs.length ? <div className="table-wrap"><table><thead><tr><th>Время</th><th>Кто</th><th>Действие</th><th>Ресурс</th></tr></thead><tbody>{auditLogs.slice(0, 20).map((entry) => <tr key={entry.id}><td>{new Date(entry.created_at).toLocaleString('ru-RU')}</td><td>{entry.actor_id ? entry.actor_id.slice(0, 8) : 'Система'}</td><td>{entry.action}</td><td><code>{entry.resource_type}{entry.resource_id ? `/${entry.resource_id.slice(0, 8)}` : ''}</code></td></tr>)}</tbody></table></div> : <p className="settings-empty">Журнал пуст.</p>}
          </div>
        </AccordionSection>
      </div>

      {showAddAccount ? <Modal title="Добавить аккаунт вручную" onClose={() => setShowAddAccount(false)}>
        <div className="form-stack">
          <label>Username Threads<input value={newAccountUsername} onChange={(e) => setNewAccountUsername(e.target.value)} placeholder="@username" /></label>
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setShowAddAccount(false)}>Отмена</Button>
            <Button onClick={async () => { if (newAccountUsername.trim()) { await addManualAccount(newAccountUsername.trim(), brands[0]?.id); setNewAccountUsername(''); setShowAddAccount(false) } }}>Добавить</Button>
          </div>
        </div>
      </Modal> : null}
    </AppShell>
  )
}
