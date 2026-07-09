import { useState } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import type { WorkspaceRole } from '../lib/database.types'

interface TeamMember {
  id: string
  email: string
  name: string
  role: WorkspaceRole
  created_at: string
}

const MOCK_MEMBERS: TeamMember[] = [
  { id: '1', email: 'owner@technowa.ai', name: 'Алексей', role: 'owner', created_at: '2025-01-01' },
  { id: '2', email: 'editor@technowa.ai', name: 'Мария', role: 'editor', created_at: '2025-02-15' },
  { id: '3', email: 'viewer@technowa.ai', name: 'Дмитрий', role: 'viewer', created_at: '2025-03-01' },
]

const ROLE_LABELS: Record<WorkspaceRole, string> = {
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
  const [members] = useState(MOCK_MEMBERS)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<string>('editor')

  return (
    <div style={{ padding: '1.5rem', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ color: '#fff', fontSize: '1.5rem', margin: 0 }}>Команда</h1>
          <p style={{ color: '#888', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>Управление доступом к рабочему пространству</p>
        </div>
        <Button onClick={() => setShowInvite(true)}>Пригласить</Button>
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2a2a2a' }}>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#888', fontWeight: 500, fontSize: '0.85rem' }}>Имя</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#888', fontWeight: 500, fontSize: '0.85rem' }}>Email</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#888', fontWeight: 500, fontSize: '0.85rem' }}>Роль</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#888', fontWeight: 500, fontSize: '0.85rem' }}>Дата</th>
              <th style={{ padding: '0.75rem 1rem' }} />
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                <td style={{ padding: '0.75rem 1rem', color: '#fff' }}>{m.name}</td>
                <td style={{ padding: '0.75rem 1rem', color: '#aaa', fontSize: '0.9rem' }}>{m.email}</td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <Badge variant={m.role === 'viewer' ? 'default' : 'accent'}>{ROLE_LABELS[m.role]}</Badge>
                </td>
                <td style={{ padding: '0.75rem 1rem', color: '#888', fontSize: '0.9rem' }}>{m.created_at}</td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                  {m.role !== 'owner' && (
                    <Select value={m.role} onChange={() => {}} options={ROLE_OPTIONS.slice(1)} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {showInvite && (
        <Modal title="Пригласить участника" onClose={() => setShowInvite(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input label="Email" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="email@company.com" />
            <Select
              label="Роль"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              options={ROLE_OPTIONS.slice(1)}
            />
            <Button onClick={() => { setShowInvite(false); setInviteEmail('') }} disabled={!inviteEmail.includes('@')}>Отправить приглашение</Button>
          </div>
        </Modal>
      )}
    </div>
  )
}