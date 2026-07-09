import { useState } from 'react'
import { MessageSquareReply, ArrowRight } from 'lucide-react'
import { Button, Card, Badge, EmptyState } from './ui'
import { analyzeIncomingComment, generateReplySuggestions, type IncomingComment } from '../lib/reply-assistant'
import { RiskBadge } from './RiskBadge'

interface ReplyAssistantProps {
  comments?: IncomingComment[]
  onSendReply: (commentId: string, text: string) => Promise<void>
}

export function ReplyAssistant({ comments = [], onSendReply }: ReplyAssistantProps) {
  const [selectedComment, setSelectedComment] = useState<string | null>(null)
  const [sending, setSending] = useState<string | null>(null)

  if (comments.length === 0) {
    return (
      <div>
        <div className="section-header">
          <span className="section-eyebrow">Reply Assistant</span>
          <h3>Входящие комментарии</h3>
        </div>
        <EmptyState icon={<MessageSquareReply size={24} />} title="Нет входящих комментариев" text="Комментарии появятся после публикации постов" />
      </div>
    )
  }

  return (
    <div>
      <div className="section-header">
        <span className="section-eyebrow">Reply Assistant</span>
        <h3>Входящие комментарии</h3>
      </div>
      <div className="reply-inbox">
        {comments.map((comment) => {
          const analysis = analyzeIncomingComment(comment)
          const suggestions = selectedComment === comment.id ? generateReplySuggestions(comment) : []

          return (
            <Card
              key={comment.id}
              className={`reply-card ${analysis.urgency === 'high' ? 'urgent' : ''} ${selectedComment === comment.id ? 'selected' : ''}`}
              onClick={() => setSelectedComment(comment.id === selectedComment ? null : comment.id)}
            >
              <div className="reply-header">
                <strong>@{comment.authorUsername}</strong>
                <div className="reply-badges">
                  {analysis.isLead && <Badge tone="green">Лид</Badge>}
                  <Badge tone={analysis.urgency === 'high' ? 'red' : analysis.urgency === 'normal' ? 'blue' : 'default'}>
                    {analysis.urgency === 'high' ? 'Срочно' : analysis.urgency === 'normal' ? 'Обычный' : 'Низкий'}
                  </Badge>
                  <Badge tone={analysis.sentiment === 'negative' ? 'red' : analysis.sentiment === 'positive' ? 'green' : 'default'}>
                    {analysis.sentiment === 'positive' ? 'Позитивный' : analysis.sentiment === 'negative' ? 'Негативный' : 'Нейтральный'}
                  </Badge>
                </div>
              </div>
              <p className="reply-text">{comment.text}</p>

              {selectedComment === comment.id && (
                <div className="reply-suggestions">
                  {suggestions.map((s, i) => (
                    <div key={i} className="suggestion-card">
                      <div className="suggestion-tone">
                        <Badge tone={s.suggestedAction === 'move_to_dm' ? 'green' : s.suggestedAction === 'ignore' ? 'red' : 'default'}>{s.suggestedAction}</Badge>
                        <RiskBadge score={s.riskScore} compact />
                      </div>
                      {s.text && (
                        <p className="suggestion-text">{s.text}</p>
                      )}
                      <small className="suggestion-explanation">{s.explanation}</small>
                      {s.text && s.suggestedAction !== 'ignore' && (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSending(comment.id)
                            onSendReply(comment.id, s.text).finally(() => setSending(null))
                          }}
                          disabled={sending === comment.id}
                        >
                          {sending === comment.id ? 'Отправка...' : 'Ответить'} <ArrowRight size={14} />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
