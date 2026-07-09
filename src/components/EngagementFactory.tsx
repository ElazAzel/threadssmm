import { useState } from 'react'
import { Search, Target, MessageSquare, ThumbsUp } from 'lucide-react'
import { Button, Card, Badge, EmptyState } from './ui'
import { RiskBadge } from './RiskBadge'
import type { CommentCampaign, CommentOpportunity, GeneratedComment } from '../lib/domain'

interface EngagementFactoryProps {
  campaigns: CommentCampaign[]
  opportunities: CommentOpportunity[]
  comments: GeneratedComment[]
  onSaveCampaign: (campaign: Partial<CommentCampaign>) => Promise<void>
  onApproveComment: (commentId: string) => Promise<void>
  onRejectComment: (commentId: string) => Promise<void>
  onFindOpportunities: () => Promise<void>
}

export function EngagementFactory({
  campaigns, opportunities, comments,
  onSaveCampaign, onApproveComment, onRejectComment, onFindOpportunities,
}: EngagementFactoryProps) {
  const [activeTab, setActiveTab] = useState('opportunities')
  const [campaignOpen, setCampaignOpen] = useState(false)
  const [newCampaign, setNewCampaign] = useState<Partial<CommentCampaign>>({})
  const tabs = ['opportunities', 'campaigns', 'comments']

  return (
    <div className="engagement-factory">
      <div className="section-header">
        <span className="section-eyebrow">Engagement Factory</span>
        <div className="section-header-row">
          <h2>Маcштабируемое присутствие</h2>
          <div className="engagement-actions">
            <Button onClick={onFindOpportunities}><Search size={16} /> Найти возможности</Button>
            <Button variant="secondary" onClick={() => { setCampaignOpen(true); setNewCampaign({}) }}><Target size={16} /> Новая кампания</Button>
          </div>
        </div>
      </div>

      <div className="tab-bar" role="tablist">
        {tabs.map((t) => (
          <button key={t} className={`tab ${activeTab === t ? 'tab-active' : ''}`} onClick={() => setActiveTab(t)}>
            {t === 'opportunities' ? `Возможности (${opportunities.filter(o => o.status === 'found' || o.status === 'proposed').length})` :
             t === 'campaigns' ? `Кампании (${campaigns.filter(c => c.status === 'active').length})` :
             `Комментарии (${comments.filter(c => c.status === 'proposed').length})`}
          </button>
        ))}
      </div>

      {activeTab === 'opportunities' && (
        <div className="opportunity-list">
          {opportunities.length === 0 ? (
            <EmptyState icon={<MessageSquare size={24} />} title="Нет возможностей" text="Нажмите «Найти возможности» для поиска постов для комментирования"
              action={<Button onClick={onFindOpportunities}><Search size={16} /> Найти</Button>} />
          ) : (
            opportunities.filter(o => o.status === 'found' || o.status === 'proposed' || o.status === 'reviewed').map((opp) => (
              <Card key={opp.id} className="opportunity-card">
                <div className="opportunity-header">
                  <div className="opportunity-meta">
                    <Badge>Score: {Math.round(opp.opportunity_score)}%</Badge>
                    <small>@{opp.author_username || 'unknown'}</small>
                    {opp.location && <small>{opp.location}</small>}
                    {opp.freshness_hours !== null && <small>{opp.freshness_hours}ч назад</small>}
                  </div>
                </div>
                <p className="opportunity-text">{opp.post_text?.slice(0, 200)}</p>
                <div className="opportunity-topics">
                  {opp.topic.map((t) => <span key={t} className="slot-tag">{t}</span>)}
                </div>
                <div className="opportunity-scores">
                  <span>Тема: {opp.topic_match}%</span>
                  <span>Аудитория: {opp.audience_match}%</span>
                  <span>Локация: {opp.location_match}%</span>
                </div>
                {opp.spam_risk > 0 && <RiskBadge score={Math.round(opp.spam_risk)} compact />}
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'campaigns' && (
        <div className="campaign-list">
          {campaigns.length === 0 ? (
            <EmptyState icon={<Target size={24} />} title="Нет кампаний" text="Создайте кампанию для системного комментирования"
              action={<Button onClick={() => { setCampaignOpen(true); setNewCampaign({}) }}><Target size={16} /> Создать кампанию</Button>} />
          ) : (
            campaigns.map((camp) => (
              <Card key={camp.id} className="campaign-card">
                <div className="campaign-header">
                  <strong>{camp.name}</strong>
                  <Badge tone={camp.status === 'active' ? 'green' : camp.status === 'paused' ? 'orange' : 'default'}>{camp.status}</Badge>
                </div>
                <div className="campaign-meta">
                  <span>Цель: {camp.goal}</span>
                  <span>Тон: {camp.tone}</span>
                  <span>Лимит: {camp.limits.perDay}/день</span>
                  <span>Режим: {camp.approval_mode}</span>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'comments' && (
        <div className="comment-list">
          {comments.filter(c => c.status === 'proposed').length === 0 ? (
            <EmptyState icon={<MessageSquare size={24} />} title="Нет предложенных комментариев" text="Комментарии появляются после нахождения возможностей" />
          ) : (
            comments.filter(c => c.status === 'proposed').map((comment) => (
              <Card key={comment.id} className="comment-card">
                <p className="comment-text">{comment.text}</p>
                <div className="comment-meta">
                  <Badge tone={comment.tone === 'expert' ? 'violet' : comment.tone === 'question' ? 'blue' : 'default'}>{comment.tone}</Badge>
                  <span>Brand fit: {comment.brand_fit_score}%</span>
                  <RiskBadge score={Math.round(comment.risk_score)} compact />
                </div>
                <div className="comment-actions">
                  <Button onClick={() => onApproveComment(comment.id)}><ThumbsUp size={14} /> Одобрить</Button>
                  <Button variant="ghost" onClick={() => onRejectComment(comment.id)}>Отклонить</Button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {campaignOpen && (
        <div className="modal-overlay" onClick={() => setCampaignOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Новая кампания комментирования</h2>
              <button className="icon-button" onClick={() => setCampaignOpen(false)}>✕</button>
            </div>
            <div className="form-stack">
              <label>Название <input value={newCampaign.name || ''} onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })} placeholder="Local Presence Алматы" /></label>
              <div className="form-row">
                <label>Цель
                  <select value={newCampaign.goal || 'awareness'} onChange={(e) => setNewCampaign({ ...newCampaign, goal: e.target.value as CommentCampaign['goal'] })}>
                    <option value="awareness">Охват</option>
                    <option value="leads">Лиды</option>
                    <option value="expertise">Экспертность</option>
                    <option value="local_domination">Локальное присутствие</option>
                    <option value="trend_hijacking">Реакция на тренды</option>
                  </select>
                </label>
                <label>Тон
                  <select value={newCampaign.tone || 'expert'} onChange={(e) => setNewCampaign({ ...newCampaign, tone: e.target.value as CommentCampaign['tone'] })}>
                    <option value="expert">Экспертный</option>
                    <option value="friendly">Дружелюбный</option>
                    <option value="supportive">Поддерживающий</option>
                    <option value="controversial">Дискуссионный</option>
                  </select>
                </label>
              </div>
              <div className="form-row">
                <label>Лимит в день <input type="number" min="1" max="30" value={newCampaign.limits?.perDay ?? 15} onChange={(e) => setNewCampaign({ ...newCampaign, limits: { ...newCampaign.limits!, perDay: Number(e.target.value) } })} /></label>
                <label>Лимит в час <input type="number" min="1" max="10" value={newCampaign.limits?.perHour ?? 3} onChange={(e) => setNewCampaign({ ...newCampaign, limits: { ...newCampaign.limits!, perHour: Number(e.target.value) } })} /></label>
              </div>
              <label>Режим публикации
                <select value={newCampaign.approval_mode || 'approve_and_publish'} onChange={(e) => setNewCampaign({ ...newCampaign, approval_mode: e.target.value as CommentCampaign['approval_mode'] })}>
                  <option value="draft_only">Только черновики</option>
                  <option value="approve_and_publish">Ручное одобрение</option>
                  <option value="manual_copy">Ручное копирование</option>
                  <option value="team_approval">Команда согласует</option>
                </select>
              </label>
            </div>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setCampaignOpen(false)}>Отмена</Button>
              <Button onClick={() => { onSaveCampaign(newCampaign); setCampaignOpen(false) }} disabled={!newCampaign.name}>Создать кампанию</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
