import { useState } from 'react'
import { Card, Button, Badge, Modal, Input, Select } from '../components/ui'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { AppShell } from '../components/AppShell'

const ROLE_LABELS: Record<string, string> = {
  owner: 'Владелец',
  admin: 'Администратор',
  editor: 'Редактор',
  viewer: 'Просматривающий',
}

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Администратор' },
  { value: 'editor', label: 'Редактор' },
  { value: 'viewer', label: 'Просматривающий' },
]

export function TeamPage() {
  const { teamMembers, inviteTeamMember, updateTeamMemberRole, removeTeamMember, workspace } = useWorkspace()
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<string>('editor')

  const handleInvite = async () => {
    if (!inviteEmail.includes('@')) return
    await inviteTeamMember(inviteEmail, inviteRole)
    setShowInvite(false)
    setInviteEmail('')
  }

  return (
    <AppShell title="Команда">
      <div className="page-content">
        <div className="page-head compact-head">
          <div>
            <h1>Команда</h1>
            <p>Управление доступом к рабочему пространству</p>
          </div>
          <Button onClick={() => setShowInvite(true)}>Пригласить</Button>
        </div>

        <Card style={{ overflow: 'hidden', padding: 0 }}>
          <table className="model-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Имя</th>
                <th>Email</th>
                <th>Роль</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem' }}>Участников пока нет</td></tr>
              )}
              {teamMembers.map((m) => (
                <tr key={m.id}>
                  <td><b>{m.name || '—'}</b></td>
                  <td><small>{m.email}</small></td>
                  <td><Badge variant={m.role === 'viewer' ? 'default' : 'accent'}>{ROLE_LABELS[m.role] || m.role}</Badge></td>
                  <td>
                    <div className="inline-form">
                      {m.role !== 'owner' && (
                        <>
                          <select value={m.role} onChange={(e) => updateTeamMemberRole(m.id, e.target.value)} style={{ width: 'auto', padding: '4px 8px', fontSize: '12px' }}>
                            {ROLE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                          </select>
                          <button className="text-button" onClick={() => removeTeamMember(m.id)} style={{ color: 'var(--danger)' }}>Удалить</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {workspace && (
          <Card className="margin-card" style={{ marginTop: '1.5rem' }}>
            <h3>О пространстве</h3>
            <div className="margin-breakdown">
              <div className="switch-row"><span>Название</span><strong>{workspace.name}</strong></div>
              <div className="switch-row"><span>Регион</span><strong>{workspace.region || '—'}</strong></div>
              <div className="switch-row"><span>Часовой пояс</span><strong>{workspace.timezone || '—'}</strong></div>
            </div>
          </Card>
        )}

        {showInvite && (
          <Modal title="Пригласить участника" onClose={() => setShowInvite(false)}>
            <div className="form-stack">
              <Input label="Email" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="email@company.com" />
              <Select label="Роль" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} options={ROLE_OPTIONS} />
              <div className="modal-actions">
                <Button variant="secondary" onClick={() => setShowInvite(false)}>Отмена</Button>
                <Button onClick={handleInvite} disabled={!inviteEmail.includes('@')}>Отправить приглашение</Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </AppShell>
  )
}
