import { useState } from 'react'
import { Check, Copy, RefreshCw, Sparkles, ThumbsUp, TrendingUp, AlertTriangle, X } from 'lucide-react'
import { Button, Badge, Card, Modal } from './ui'
import { scoreVariants, getBestVariant, critiqueVariant } from '../lib/intent-engine'
import type { PipelineResult, VariantWithScore } from '../lib/intent-engine'

interface ResultManagerProps {
  variants: Array<{ id: string; text: string; tone: string; hookScore: number; complianceScore: number; complianceNote: string }>
  pipelineResult: PipelineResult | null
  onSave: (variantId: string) => void
  onApprove: (variantId: string) => void
  onRepairRequest: (variantId: string, repairPrompt: string) => void
  onClose?: () => void
}

export function ResultManager({
  variants,
  pipelineResult,
  onSave,
  onApprove,
  onRepairRequest,
  onClose,
}: ResultManagerProps) {
  const [selected, setSelected] = useState<string | null>(variants[0]?.id ?? null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showCritic, setShowCritic] = useState(true)

  const context = pipelineResult?.context ?? null
  const slots = pipelineResult?.slots ?? null

  const scored: VariantWithScore[] = context && slots
    ? scoreVariants(variants, context, slots)
    : variants.map((v) => ({ ...v, criticScore: undefined }))

  const best = context && slots ? getBestVariant(scored) : null
  const selectedVariant = scored.find((v) => v.id === selected) ?? scored[0]

  const copyVariant = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="result-manager">
      <div className="result-header">
        <div className="result-header-left">
          <h2>Варианты публикации</h2>
          {best && (
            <Badge tone="blue">
              <TrendingUp size={12} /> Лучший: вариант {best.id}
            </Badge>
          )}
        </div>
        <div className="result-header-actions">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCritic(!showCritic)}
          >
            {showCritic ? 'Скрыть' : 'Показать'} оценку
          </Button>
          {onClose && (
            <button className="icon-button" onClick={onClose} aria-label="Закрыть результаты">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="variant-grid">
        {scored.map((v) => (
          <Card
            key={v.id}
            className={`variant-card ${selected === v.id ? 'selected' : ''}`}
            onClick={() => setSelected(v.id)}
          >
            <div className="variant-top">
              <Badge>Вариант {v.id}</Badge>
              <Badge tone={v.complianceScore < 70 ? 'orange' : v.id === 'B' ? 'violet' : 'blue'}>
                {v.tone}
              </Badge>
              <button
                className="icon-button"
                onClick={(e) => { e.stopPropagation(); copyVariant(v.text, v.id) }}
                aria-label="Копировать"
              >
                {copiedId === v.id ? <Check size={17} /> : <Copy size={17} />}
              </button>
            </div>

            <p className="variant-copy">{v.text}</p>

            <div className="variant-scores">
              <span>
                <small>Hook</small>
                <b>{v.hookScore.toFixed(1)}</b>
              </span>
              <span>
                <small>Compliance</small>
                <b>{v.complianceScore}%</b>
              </span>
              {v.criticScore && (
                <span>
                  <small>Общая</small>
                  <b>{v.criticScore.overall.toFixed(1)}</b>
                </span>
              )}
            </div>

            {/* Critic details */}
            {showCritic && v.criticScore && v.criticScore.issues.length > 0 && (
              <div className="critic-issues">
                {v.criticScore.issues.slice(0, 2).map((issue, i) => (
                  <span key={i} className="critic-issue">
                    <AlertTriangle size={12} />
                    {issue}
                  </span>
                ))}
                {v.criticScore.issues.length > 2 && (
                  <small className="more-issues">+{v.criticScore.issues.length - 2} проблем</small>
                )}
              </div>
            )}

            {/* Critic radar */}
            {showCritic && v.criticScore && (
              <div className="critic-radar">
                {(['hookStrength', 'clarity', 'humanTone', 'brandFit', 'ctaQuality', 'threadsFit'] as const).map((key) => {
                  const score = v.criticScore![key]
                  return (
                    <div key={key} className="critic-bar" title={`${key}: ${score}/10`}>
                      <span className="critic-label">
                        {key === 'hookStrength' ? 'Хук' :
                         key === 'clarity' ? 'Ясность' :
                         key === 'humanTone' ? 'Тон' :
                         key === 'brandFit' ? 'Бренд' :
                         key === 'ctaQuality' ? 'CTA' : 'Threads'}
                      </span>
                      <div className="critic-track">
                        <div className="critic-fill" style={{
                          width: `${(score / 10) * 100}%`,
                          background: score >= 7 ? '#22c55e' : score >= 4 ? '#f59e0b' : '#ef4444',
                        }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Actions */}
            <div className="split-actions">
              <Button variant="secondary" onClick={(e) => { e.stopPropagation(); onSave(v.id) }}>
                Сохранить
              </Button>
              <Button onClick={(e) => { e.stopPropagation(); onApprove(v.id) }}>
                <ThumbsUp size={16} /> Согласовать
              </Button>
            </div>

            {/* Repair button if score is low */}
            {v.criticScore && v.criticScore.overall < 7 && (
              <button
                className="repair-button"
                onClick={(e) => {
                  e.stopPropagation()
                  const repairPrompt = `Улучши этот текст для Threads. Проблемы: ${v.criticScore!.issues.join('; ')}. Сохрани смысл, исправь слабые места.\n\nТекст:\n"""${v.text}"""`
                  onRepairRequest(v.id, repairPrompt)
                }}
              >
                <RefreshCw size={14} /> Улучшить ({v.criticScore.overall.toFixed(1)}/10)
              </button>
            )}
          </Card>
        ))}
      </div>

      {/* Best variant highlight */}
      {best && best.id !== selectedVariant.id && (
        <div className="best-variant-hint">
          <Sparkles size={14} />
          <span>Рекомендуем вариант <strong>{best.id}</strong> — у него лучшая общая оценка ({best.criticScore?.overall.toFixed(1) ?? best.hookScore.toFixed(1)}/10)</span>
          <Button variant="ghost" size="sm" onClick={() => setSelected(best.id)}>
            Выбрать
          </Button>
        </div>
      )}
    </div>
  )
}

export function FullCriticModal({
  variant,
  onClose,
}: {
  variant: { id: string; text: string; tone: string; hookScore: number }
  onClose: () => void
}) {
  const score = critiqueVariant(variant.text, {
    brandName: '',
    brandVoice: '',
    platformRules: '',
    offer: '',
    audience: '',
    positioning: '',
    usp: '',
    contentPillars: [],
    ctas: [],
    forbiddenTopics: [],
    forbiddenPhrases: [],
    goodExamples: '',
    badExamples: '',
    recentPosts: '',
  }, {
    topic: null,
    format: 'post',
    tone: null,
    audience: null,
    goal: null,
    cta: null,
    length: null,
    language: 'ru',
    platform: 'Threads',
  })

  return (
    <Modal title={`Детальная оценка — вариант ${variant.id}`} onClose={onClose}>
      <div className="critic-detail-modal">
        <div className="critic-text-preview">
          <p>{variant.text}</p>
        </div>
        <div className="critic-scores-grid">
          {([
            { key: 'hookStrength', label: 'Сила хука' },
            { key: 'clarity', label: 'Ясность' },
            { key: 'humanTone', label: 'Человечность' },
            { key: 'brandFit', label: 'Соответствие бренду' },
            { key: 'ctaQuality', label: 'Качество CTA' },
            { key: 'threadsFit', label: 'Формат Threads' },
          ] as const).map(({ key, label }) => (
            <div key={key} className="critic-score-row">
              <span>{label}</span>
              <div className="critic-track large">
                <div
                  className="critic-fill"
                  style={{
                    width: `${(score[key] / 10) * 100}%`,
                    background: score[key] >= 7 ? '#22c55e' : score[key] >= 4 ? '#f59e0b' : '#ef4444',
                  }}
                />
              </div>
              <strong>{score[key]}/10</strong>
            </div>
          ))}
        </div>
        {score.issues.length > 0 && (
          <div className="critic-issues-full">
            <h4><AlertTriangle size={16} /> Проблемы</h4>
            <ul>
              {score.issues.map((issue, i) => (
                <li key={i}>{issue}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="critic-overall">
          <strong>Общая оценка: {score.overall.toFixed(1)}/10</strong>
        </div>
      </div>
    </Modal>
  )
}
