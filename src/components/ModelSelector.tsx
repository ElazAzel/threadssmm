import { useState } from 'react'
import { Sparkles, Coins, Image, MessageSquare, Palette } from 'lucide-react'
import { AI_MODELS, getModelById, getModelsByCategory, type AiCategory } from '../lib/ai-models'

interface ModelSelectorProps {
  value: string
  onChange: (modelId: string) => void
  tokenBalance?: number
  category?: AiCategory
}

const CATEGORY_LABELS: Record<AiCategory, { label: string; icon: typeof Sparkles }> = {
  text_visual: { label: 'Текст + Визуал', icon: Sparkles },
  text_only: { label: 'Только текст', icon: MessageSquare },
  visual_only: { label: 'Визуал (изображения)', icon: Image },
}

export function ModelSelector({ value, onChange, tokenBalance, category }: ModelSelectorProps) {
  const [open, setOpen] = useState(false)
  const selected = getModelById(value) ?? AI_MODELS[0]
  const models = category ? getModelsByCategory(category) : AI_MODELS
  const grouped = category ? null : {
    text_visual: AI_MODELS.filter((m) => m.category === 'text_visual'),
    text_only: AI_MODELS.filter((m) => m.category === 'text_only'),
    visual_only: AI_MODELS.filter((m) => m.category === 'visual_only'),
  }

  const CategoryIcon = selected ? CATEGORY_LABELS[selected.category]?.icon ?? Sparkles : Sparkles

  return (
    <div className="model-selector" style={{ position: 'relative' }}>
      <span className="field-label">Модель AI</span>
      <button className="model-selector-trigger" onClick={() => setOpen(!open)} type="button">
        <CategoryIcon size={14} />
        <span>{selected.label}</span>
        <small style={{ color: 'var(--muted)', fontSize: 11 }}>{selected.tokenCost} ток.{selected.tokenCost > 1 ? '' : ''}</small>
      </button>
      {tokenBalance !== undefined && (
        <div className="token-balance">
          <Coins size={12} />
          <span>{tokenBalance} токенов</span>
        </div>
      )}
      {open && (
        <>
          <div className="model-selector-backdrop" onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 60 }} />
          <div className="model-selector-dropdown" style={{ position: 'absolute', top: '100%', left: 0, zIndex: 61, minWidth: 320, marginTop: 4, border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', background: '#181c22', boxShadow: '0 8px 32px rgba(0,0,0,.4)', maxHeight: 400, overflowY: 'auto' }}>
            {grouped ? (
              <>
                {(Object.entries(grouped) as Array<[AiCategory, typeof AI_MODELS]>).filter(([, ms]) => ms.length > 0).map(([cat, ms]) => (
                  <div key={cat}>
                    <div style={{ padding: '8px 14px 4px', fontSize: 'var(--text-xs)', color: 'var(--accent)', fontWeight: 600, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {CATEGORY_LABELS[cat]?.icon === Image ? <><Palette size={10} style={{ display: 'inline' }} /> </> : ''}{CATEGORY_LABELS[cat]?.label ?? cat}
                    </div>
                    {ms.map((model) => renderModelOption(model))}
                  </div>
                ))}
              </>
            ) : (
              models.map((model) => renderModelOption(model))
            )}
          </div>
        </>
      )}
    </div>
  )

  function renderModelOption(model: typeof AI_MODELS[number]) {
    const Icon = CATEGORY_LABELS[model.category]?.icon ?? Sparkles
    return (
      <button
        key={model.id}
        className={`model-option ${model.id === value ? 'active' : ''}`}
        onClick={() => { onChange(model.id); setOpen(false) }}
        type="button"
        style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px',
          border: 0, borderBottom: '1px solid var(--border)',
          background: model.id === value ? 'color-mix(in srgb, var(--accent), transparent 85%)' : 'transparent',
          color: 'var(--fg)', fontSize: 'var(--text-sm)', textAlign: 'left', cursor: 'pointer',
        } as React.CSSProperties}
      >
        <Icon size={14} style={{ color: 'var(--muted)', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600 }}>{model.label} <TierBadge tier={model.tier} /></div>
          <div style={{ color: 'var(--muted)', fontSize: 'var(--text-xs)' }}>{model.description}</div>
        </div>
        <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 10, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
          {model.tokenCost} тн
        </span>
      </button>
    )
  }
}

function TierBadge({ tier }: { tier: string }) {
  const style: Record<string, React.CSSProperties> = {
    budget: { color: '#6b7280', background: '#1f2228', border: '1px solid #2d323a' },
    mid: { color: '#60a5fa', background: '#1a2633', border: '1px solid #2a3a50' },
    flagship: { color: '#c084fc', background: '#231d2e', border: '1px solid #382a4a' },
  }
  const labels: Record<string, string> = { budget: 'Budget', mid: 'Средний', flagship: 'Флагман' }
  return <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 4, fontWeight: 500, marginLeft: 6, ...(style[tier] ?? style.budget) } as React.CSSProperties}>{labels[tier] ?? tier}</span>
}
