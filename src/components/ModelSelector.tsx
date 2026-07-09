import { useState } from 'react'
import { Sparkles, Coins } from 'lucide-react'
import { AI_MODELS, getModelById } from '../lib/ai-models'

interface ModelSelectorProps {
  value: string
  onChange: (modelId: string) => void
  tokenBalance?: number
}

export function ModelSelector({ value, onChange, tokenBalance }: ModelSelectorProps) {
  const [open, setOpen] = useState(false)
  const selected = getModelById(value) ?? AI_MODELS[0]

  return (
    <div className="model-selector" style={{ position: 'relative' }}>
      <span className="field-label">Модель AI</span>
      <button className="model-selector-trigger" onClick={() => setOpen(!open)} type="button">
        <Sparkles size={14} />
        <span>{selected.label}</span>
        <small style={{ color: 'var(--muted)', fontSize: 11 }}>{selected.tokenCost} токен{selected.tokenCost > 1 ? 'а' : ''}</small>
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
          <div className="model-selector-dropdown" style={{ position: 'absolute', top: '100%', left: 0, zIndex: 61, minWidth: 280, marginTop: 4, border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', background: '#181c22', boxShadow: '0 8px 32px rgba(0,0,0,.4)' }}>
            {AI_MODELS.map((model) => (
              <button
                key={model.id}
                className={`model-option ${model.id === value ? 'active' : ''}`}
                onClick={() => { onChange(model.id); setOpen(false) }}
                type="button"
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', border: 0, background: model.id === value ? 'color-mix(in srgb, var(--accent), transparent 85%)' : 'transparent', color: 'var(--fg)', fontSize: 'var(--text-sm)', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid var(--border)' } as React.CSSProperties}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{model.label}</div>
                  <div style={{ color: 'var(--muted)', fontSize: 'var(--text-xs)' }}>{model.description}</div>
                </div>
                <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 'var(--text-xs)', whiteSpace: 'nowrap' }}>{model.tokenCost} ток.{model.tokenCost > 1 ? '' : ''}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
