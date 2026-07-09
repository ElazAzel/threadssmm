import { useState } from 'react'
import { CheckCircle, XCircle, Eye, AlertTriangle } from 'lucide-react'
import { Button, Card, Badge, EmptyState } from './ui'
import { RiskBadge } from './RiskBadge'
import type { Approval, Draft } from '../lib/domain'

interface ApprovalQueueProps {
  approvals: Approval[]
  drafts: Draft[]
  onReview: (approvalId: string, status: 'approved' | 'rejected' | 'changes_requested', note?: string) => Promise<void>
}

export function ApprovalQueue({ approvals, drafts, onReview }: ApprovalQueueProps) {
  const [activeTab, setActiveTab] = useState('pending')
  const [reviewNote, setReviewNote] = useState('')
  const [reviewing, setReviewing] = useState<string | null>(null)

  const pending = approvals.filter(a => a.status === 'pending')
  const reviewed = approvals.filter(a => a.status !== 'pending')

  const getDraftForApproval = (approvalId: string) => {
    const a = approvals.find(ap => ap.id === approvalId)
    return a ? drafts.find(d => d.id === a.draft_id) : null
  }

  const handleReview = async (approvalId: string, status: 'approved' | 'rejected' | 'changes_requested') => {
    setReviewing(approvalId)
    try {
      await onReview(approvalId, status, reviewNote)
      setReviewNote('')
    } finally {
      setReviewing(null)
    }
  }

  const tabs = ['pending', 'history']

  return (
    <div className="approval-queue">
      <div className="section-header">
        <span className="section-eyebrow">Согласование</span>
        <h3>Очередь на approval</h3>
      </div>

      <div className="tab-bar" role="tablist">
        {tabs.map((t) => (
          <button key={t} className={`tab ${activeTab === t ? 'tab-active' : ''}`} onClick={() => setActiveTab(t)}>
            {t === 'pending' ? `На согласовании (${pending.length})` : `История (${reviewed.length})`}
          </button>
        ))}
      </div>

      {activeTab === 'pending' && (
        <div className="approval-list">
          {pending.length === 0 ? (
            <EmptyState icon={<CheckCircle size={24} />} title="Всё согласовано" text="Нет материалов, ожидающих approval" />
          ) : (
            pending.map((approval) => {
              const draft = getDraftForApproval(approval.id)
              return (
                <Card key={approval.id} className="approval-card">
                  <div className="approval-header">
                    <strong>{draft?.title || 'Без названия'}</strong>
                    <Badge tone={draft?.risk_level === 'high' ? 'red' : draft?.risk_level === 'medium' ? 'orange' : 'green'}>
                      {draft?.format === 'post' ? 'Пост' : draft?.format === 'thread' ? 'Тред' : draft?.format === 'reply' ? 'Ответ' : draft?.format}
                    </Badge>
                  </div>
                  {draft?.risk_score != null && draft.risk_score > 0 && (
                    <RiskBadge score={draft.risk_score} />
                  )}
                  <p className="approval-content">{draft?.content?.slice(0, 200)}</p>
                  {draft?.variants && draft.variants.length > 0 && (
                    <div className="approval-variants">
                      {draft.variants.map((v) => (
                        <div key={v.id} className="variant-preview">
                          <small>Вариант {v.label}: {v.content.slice(0, 100)}...</small>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="approval-actions">
                    <Button onClick={() => handleReview(approval.id, 'approved')} disabled={reviewing === approval.id}>
                      <CheckCircle size={16} /> Утвердить
                    </Button>
                    <Button variant="secondary" onClick={() => handleReview(approval.id, 'changes_requested')} disabled={reviewing === approval.id}>
                      <AlertTriangle size={16} /> На доработку
                    </Button>
                    <Button variant="ghost" onClick={() => handleReview(approval.id, 'rejected')} disabled={reviewing === approval.id}>
                      <XCircle size={16} /> Отклонить
                    </Button>
                  </div>
                  <div className="approval-note">
                    <input
                      placeholder="Замечания (необязательно)"
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                    />
                  </div>
                </Card>
              )
            })
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="approval-history">
          {reviewed.length === 0 ? (
            <EmptyState icon={<Eye size={24} />} title="Нет истории" text="Здесь появятся просмотренные approval" />
          ) : (
            reviewed.map((approval) => (
              <Card key={approval.id} className="history-card">
                <div className="history-header">
                  <Badge tone={approval.status === 'approved' ? 'green' : approval.status === 'rejected' ? 'red' : 'orange'}>
                    {approval.status === 'approved' ? 'Утверждён' : approval.status === 'rejected' ? 'Отклонён' : 'На доработку'}
                  </Badge>
                  <small>{new Date(approval.reviewed_at || approval.created_at).toLocaleDateString('ru-RU')}</small>
                </div>
                {approval.decision_note && <p className="history-note">{approval.decision_note}</p>}
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
