import { useState } from 'react'
import { Plus, Pencil, Trash2, MapPin } from 'lucide-react'
import { Button, Card, EmptyState } from './ui'
import type { Location } from '../lib/domain'

interface LocationSettingsProps {
  locations: Location[]
  onSave: (location: Partial<Location>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

const TIMEZONES = ['Asia/Almaty', 'Asia/Astana', 'Asia/Shanghai', 'Asia/Dubai', 'Europe/Moscow', 'Europe/London', 'America/New_York', 'America/Los_Angeles', 'UTC']

export function LocationSettings({ locations, onSave, onDelete }: LocationSettingsProps) {
  const [editing, setEditing] = useState<Partial<Location> | null>(null)
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

  if (!locations || locations.length === 0) {
    return (
      <div>
        <div className="section-header">
          <span className="section-eyebrow">Локации</span>
          <h3>Настройки локаций</h3>
        </div>
        <EmptyState
          icon={<MapPin size={24} />}
          title="Нет настроенных локаций"
          text="Добавьте города и регионы для адаптации контента"
          action={<Button onClick={() => setEditing({ name: '', country: 'Казахстан', city: '', language: 'ru', timezone: 'Asia/Almaty', currency: '₸', formality: 50, post_hours: { start: 10, end: 20 }, local_examples: [], local_references: [], local_events: [], local_business_terms: [] })}><Plus size={16} /> Добавить локацию</Button>}
        />
      </div>
    )
  }

  return (
    <div>
      <div className="section-header">
        <span className="section-eyebrow">Локации</span>
        <div className="section-header-row">
          <h3>Настройки локаций</h3>
          <Button onClick={() => setEditing({ name: '', country: 'Казахстан', city: '', language: 'ru', timezone: 'Asia/Almaty', currency: '₸', formality: 50, post_hours: { start: 10, end: 20 }, local_examples: [], local_references: [], local_events: [], local_business_terms: [] })}><Plus size={16} /> Добавить</Button>
        </div>
      </div>

      <div className="location-grid">
        {locations.map((loc) => (
          <Card key={loc.id} className="location-card">
            <div className="location-header">
              <strong><MapPin size={16} /> {loc.name}</strong>
              <div className="location-actions">
                <button className="icon-button" onClick={() => setEditing(loc)}><Pencil size={16} /></button>
                <button className="icon-button" onClick={() => onDelete(loc.id)}><Trash2 size={16} /></button>
              </div>
            </div>
            <div className="location-details">
              <span>{loc.city ? `${loc.city}, ` : ''}{loc.country}</span>
              <span>{loc.language === 'kk' ? 'Қазақ' : loc.language === 'en' ? 'English' : 'Русский'}</span>
              <span>{loc.currency}</span>
              <span>{loc.timezone}</span>
            </div>
            {loc.local_business_terms.length > 0 && (
              <div className="location-terms">
                {loc.local_business_terms.map((t) => <span key={t} className="slot-tag">{t}</span>)}
              </div>
            )}
            <div className="location-hours">
              <small>Лучшее время: {loc.post_hours?.start ?? 10}:00 — {loc.post_hours?.end ?? 20}:00</small>
            </div>
          </Card>
        ))}
      </div>

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing.id ? 'Редактировать локацию' : 'Новая локация'}</h2>
              <button className="icon-button" onClick={() => setEditing(null)}>✕</button>
            </div>
            <div className="form-stack">
              <label>Название <input value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Алматы" /></label>
              <div className="form-row">
                <label>Страна <input value={editing.country || ''} onChange={(e) => setEditing({ ...editing, country: e.target.value })} /></label>
                <label>Город <input value={editing.city || ''} onChange={(e) => setEditing({ ...editing, city: e.target.value })} /></label>
              </div>
              <div className="form-row">
                <label>Язык
                  <select value={editing.language || 'ru'} onChange={(e) => setEditing({ ...editing, language: e.target.value as 'ru' | 'kk' | 'en' })}>
                    <option value="ru">Русский</option>
                    <option value="kk">Қазақ</option>
                    <option value="en">English</option>
                  </select>
                </label>
                <label>Валюта <input value={editing.currency || '₸'} onChange={(e) => setEditing({ ...editing, currency: e.target.value })} /></label>
              </div>
              <div className="form-row">
                <label>Часовой пояс
                  <select value={editing.timezone || 'Asia/Almaty'} onChange={(e) => setEditing({ ...editing, timezone: e.target.value })}>
                    {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                  </select>
                </label>
                <label>Формальность {editing.formality ?? 50}%
                  <input type="range" min="0" max="100" value={editing.formality ?? 50} onChange={(e) => setEditing({ ...editing, formality: Number(e.target.value) })} />
                </label>
              </div>
              <div className="form-row">
                <label>Начало публикаций <input type="number" min="0" max="23" value={editing.post_hours?.start ?? 10} onChange={(e) => setEditing({ ...editing, post_hours: { ...editing.post_hours!, start: Number(e.target.value) } })} /></label>
                <label>Конец публикаций <input type="number" min="0" max="23" value={editing.post_hours?.end ?? 20} onChange={(e) => setEditing({ ...editing, post_hours: { ...editing.post_hours!, end: Number(e.target.value) } })} /></label>
              </div>
              <label>Локальные примеры (по одному на строку)
                <textarea value={(editing.local_examples ?? []).join('\n')} onChange={(e) => setEditing({ ...editing, local_examples: e.target.value.split('\n').filter(Boolean) })} rows={2} placeholder="магазин на Арбате" />
              </label>
              <label>Локальные ссылки (по одному на строку)
                <textarea value={(editing.local_references ?? []).join('\n')} onChange={(e) => setEditing({ ...editing, local_references: e.target.value.split('\n').filter(Boolean) })} rows={2} placeholder="как в Kaspi" />
              </label>
              <label>Бизнес-термины (через запятую)
                <input value={(editing.local_business_terms ?? []).join(', ')} onChange={(e) => setEditing({ ...editing, local_business_terms: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="тенге, Kaspi, WhatsApp" />
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
