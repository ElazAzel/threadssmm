import { useState } from 'react'
import { Plus, Pencil, Trash2, Users } from 'lucide-react'
import { Button, Card, EmptyState } from './ui'
import { SEGMENT_TYPES, AWARENESS_LEVELS, ARCHETYPES, getDefaultSegmentCommunication, getDefaultPains, getDefaultDesires } from '../lib/audience-segments'
import type { AudienceSegment } from '../lib/domain'

interface AudienceManagerProps {
  segments: AudienceSegment[]
  onSave: (segment: Partial<AudienceSegment>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function AudienceManager({ segments, onSave, onDelete }: AudienceManagerProps) {
  const [editing, setEditing] = useState<Partial<AudienceSegment> | null>(null)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!editing || !editing.name) return
    setSaving(true)
    try {
      await onSave(editing)
      setEditing(null)
    } finally {
      setSaving(false)
    }
  }

  if (!segments || segments.length === 0) {
    return (
      <div>
        <div className="section-header">
          <span className="section-eyebrow">Аудитории</span>
          <h3>Сегменты аудитории</h3>
        </div>
        <EmptyState
          icon={<Users size={24} />}
          title="Нет сегментов аудитории"
          text="Создайте сегменты, чтобы адаптировать контент под разные группы"
          action={<Button onClick={() => setEditing({ name: '', segment_type: 'entrepreneur', awareness_level: 'cold', archetype: 'pragmatic', pains: [], desires: [], triggers: [], forbidden_topics: [], communication: getDefaultSegmentCommunication('entrepreneur') as AudienceSegment['communication'], offer_mapping: { primaryOffer: '', objections: [], valueProps: [], localReferences: [] } })}><Plus size={16} /> Создать сегмент</Button>}
        />
      </div>
    )
  }

  return (
    <div>
      <div className="section-header">
        <span className="section-eyebrow">Аудитории</span>
        <div className="section-header-row">
          <h3>Сегменты аудитории</h3>
          <Button onClick={() => setEditing({ name: '', segment_type: 'entrepreneur', awareness_level: 'cold', archetype: 'pragmatic', pains: [], desires: [], triggers: [], forbidden_topics: [], communication: getDefaultSegmentCommunication('entrepreneur') as AudienceSegment['communication'], offer_mapping: { primaryOffer: '', objections: [], valueProps: [], localReferences: [] } })}><Plus size={16} /> Создать</Button>
        </div>
      </div>

      <div className="segment-grid">
        {segments.map((seg) => (
          <Card key={seg.id} className="segment-card">
            <div className="segment-header">
              <strong>{seg.name}</strong>
              <div className="segment-actions">
                <button className="icon-button" onClick={() => setEditing(seg)}><Pencil size={16} /></button>
                <button className="icon-button" onClick={() => onDelete(seg.id)}><Trash2 size={16} /></button>
              </div>
            </div>
            <div className="segment-meta">
              <span>{SEGMENT_TYPES.find(t => t.value === seg.segment_type)?.label}</span>
              <span>{AWARENESS_LEVELS.find(a => a.value === seg.awareness_level)?.label}</span>
              <span>{ARCHETYPES.find(a => a.value === seg.archetype)?.label}</span>
            </div>
            {seg.pains.length > 0 && (
              <div className="segment-tags">
                <small>Боли:</small>
                {seg.pains.slice(0, 3).map((p) => <span key={p} className="slot-tag">{p}</span>)}
              </div>
            )}
            {seg.desires.length > 0 && (
              <div className="segment-tags">
                <small>Желания:</small>
                {seg.desires.slice(0, 3).map((d) => <span key={d} className="slot-tag accent">{d}</span>)}
              </div>
            )}
            <div className="segment-style">
              <small>Стиль: {seg.communication.language === 'kk' ? 'Казахский' : seg.communication.language === 'en' ? 'Английский' : 'Русский'}</small>
              <small>Формальность: {seg.communication.formality}%</small>
              <small>Дерзость: {seg.communication.boldness}%</small>
            </div>
          </Card>
        ))}
      </div>

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing.id ? 'Редактировать сегмент' : 'Новый сегмент'}</h2>
              <button className="icon-button" onClick={() => setEditing(null)}>✕</button>
            </div>
            <div className="form-stack">
              <label>Название сегмента
                <input value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Предприниматели Алматы" />
              </label>
              <div className="form-row">
                <label>Тип аудитории
                  <select value={editing.segment_type || 'entrepreneur'} onChange={(e) => {
                    const t = e.target.value
                    setEditing({ ...editing, segment_type: t as AudienceSegment['segment_type'], pains: getDefaultPains(t), desires: getDefaultDesires(t), communication: getDefaultSegmentCommunication(t) as AudienceSegment['communication'] })
                  }}>
                    {SEGMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </label>
                <label>Уровень осведомлённости
                  <select value={editing.awareness_level || 'cold'} onChange={(e) => setEditing({ ...editing, awareness_level: e.target.value as AudienceSegment['awareness_level'] })}>
                    {AWARENESS_LEVELS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                  </select>
                </label>
              </div>
              <label>Архетип
                <select value={editing.archetype || 'pragmatic'} onChange={(e) => setEditing({ ...editing, archetype: e.target.value as AudienceSegment['archetype'] })}>
                  {ARCHETYPES.map((a) => <option key={a.value} value={a.value}>{a.label} — {a.description}</option>)}
                </select>
              </label>
              <div className="form-row">
                <label>Язык
                  <select value={editing.communication?.language || 'ru'} onChange={(e) => setEditing({ ...editing, communication: { ...editing.communication!, language: e.target.value } })}>
                    <option value="ru">Русский</option>
                    <option value="kk">Казахский</option>
                    <option value="en">Английский</option>
                  </select>
                </label>
                <label>Дерзость
                  <input type="range" min="0" max="100" value={editing.communication?.boldness ?? 30}
                    onChange={(e) => setEditing({ ...editing, communication: { ...editing.communication!, boldness: Number(e.target.value) } })}
                  />
                </label>
              </div>
              <label>Боли (по одной на строку)
                <textarea value={editing.pains?.join('\n') || ''} onChange={(e) => setEditing({ ...editing, pains: e.target.value.split('\n').filter(Boolean) })} rows={3} />
              </label>
              <label>Желания (по одной на строку)
                <textarea value={editing.desires?.join('\n') || ''} onChange={(e) => setEditing({ ...editing, desires: e.target.value.split('\n').filter(Boolean) })} rows={3} />
              </label>
              <label>Триггеры (по одному на строку)
                <textarea value={editing.triggers?.join('\n') || ''} onChange={(e) => setEditing({ ...editing, triggers: e.target.value.split('\n').filter(Boolean) })} rows={3} />
              </label>
            </div>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setEditing(null)}>Отмена</Button>
              <Button onClick={handleSave} disabled={!editing.name || saving}>{saving ? 'Сохранение...' : 'Сохранить'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
