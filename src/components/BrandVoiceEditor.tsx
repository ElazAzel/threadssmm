import { useMemo } from 'react'
import { BRAND_VOICE_TRAITS, BRAND_ARCHETYPES, type BrandVoiceSelection } from '../lib/brand-voice'


interface BrandVoiceEditorProps {
  value: Partial<BrandVoiceSelection>
  onChange: (value: Partial<BrandVoiceSelection>) => void
}

export function BrandVoiceEditor({ value, onChange }: BrandVoiceEditorProps) {
  const set = (key: keyof BrandVoiceSelection, val: string | string[]) => onChange({ ...value, [key]: val })

  const traitEntries = useMemo(() => Object.entries(BRAND_VOICE_TRAITS), [])

  return (
    <div className="brand-voice-editor">
      <div className="section-header">
        <span className="section-eyebrow">Голос бренда</span>
        <h3>Настройте стиль общения</h3>
      </div>

      <div className="archetype-grid">
        {BRAND_ARCHETYPES.map((arch) => (
          <button
            key={arch.id}
            className={`pill ${value.brandArchetype === arch.id ? 'active' : ''}`}
            onClick={() => set('brandArchetype', arch.id)}
          >
            <strong>{arch.label}</strong>
            <small>{arch.description}</small>
          </button>
        ))}
      </div>

      {traitEntries.map(([key, trait]) => {
        const typedKey = key as keyof BrandVoiceSelection
        const isMulti = 'multiple' in trait && trait.multiple
        const current = value[typedKey]
        const selectedValues = isMulti ? (Array.isArray(current) ? current : []) : [typeof current === 'string' ? current : '']
        const traitLabel = (trait as { label?: string }).label ?? ''

        return (
          <div key={key}>
            <span className="field-label">{traitLabel}</span>
            <div className="chip-group">
              {trait.options.map((opt) => {
                const isSelected = isMulti ? selectedValues.includes(opt.value) : selectedValues[0] === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`pill ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      if (isMulti) {
                        const next = isSelected ? selectedValues.filter((v) => v !== opt.value) : [...selectedValues, opt.value]
                        set(typedKey, next)
                      } else {
                        set(typedKey, opt.value)
                      }
                    }}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      <div className="form-row">
        <div className="form-group">
          <span className="field-label">Стиль CTA</span>
          <div className="chip-group">
            {['none', 'soft', 'direct', 'question'].map((s) => (
              <button key={s} className={`pill ${value.ctaStyle === s ? 'active' : ''}`} onClick={() => set('ctaStyle', s)}>
                {s === 'none' ? 'Без CTA' : s === 'soft' ? 'Мягкий' : s === 'direct' ? 'Прямой' : 'Вопрос'}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <span className="field-label">Стиль юмора</span>
          <div className="chip-group">
            {['none', 'subtle', 'friendly', 'playful', 'sarcastic'].map((s) => (
              <button key={s} className={`pill ${value.humorStyle === s ? 'active' : ''}`} onClick={() => set('humorStyle', s)}>
                {s === 'none' ? 'Без юмора' : s === 'subtle' ? 'Лёгкая ирония' : s === 'friendly' ? 'Дружеский' : s === 'playful' ? 'Игривый' : 'Саркастичный'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <span className="field-label">Уровень дерзости</span>
          <input type="range" min="0" max="100" value={value.boldnessLevel ?? 30}
            onChange={(e) => set('boldnessLevel', e.target.value)}
          />
          <div className="range-labels"><span>Сдержанный</span><span>Смелый</span></div>
        </div>

        <div className="form-group">
          <span className="field-label">Уровень формальности</span>
          <input type="range" min="0" max="100" value={value.formalityLevel ?? 50}
            onChange={(e) => set('formalityLevel', e.target.value)}
          />
          <div className="range-labels"><span>Непринуждённый</span><span>Официальный</span></div>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <span className="field-label">Любимые слова (через запятую)</span>
          <input
            type="text"
            placeholder="инновации, эффективность, рост"
            value={(value.lovedWords ?? []).join(', ')}
            onChange={(e) => set('lovedWords', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
          />
        </div>
        <div className="form-group">
          <span className="field-label">Слова, которых избегать (через запятую)</span>
          <input
            type="text"
            placeholder="синергия, революционный, best-in-class"
            value={(value.hatedWords ?? []).join(', ')}
            onChange={(e) => set('hatedWords', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
          />
        </div>
      </div>

      <div className="form-group">
        <span className="field-label">Гайд по стилю ответов</span>
        <textarea
          placeholder="Как бренд отвечает на комментарии, споры, негатив..."
          value={value.replyStyleGuide ?? ''}
          onChange={(e) => set('replyStyleGuide', e.target.value)}
          rows={3}
        />
      </div>
    </div>
  )
}
