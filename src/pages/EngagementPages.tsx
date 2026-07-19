import { useState, useEffect } from 'react'
import { AppShell } from '../components/AppShell'
import { EngagementFactory } from '../components/EngagementFactory'
import { AudienceManager } from '../components/AudienceManager'
import { LocationSettings } from '../components/LocationSettings'
import { ReplyAssistant } from '../components/ReplyAssistant'
import { BrandVoiceEditor } from '../components/BrandVoiceEditor'
import { Button, Card, EmptyState, Spinner } from '../components/ui'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { useAuth } from '../contexts/AuthContext'
import type { AudienceSegment, Location, CommentCampaign, CommentOpportunity, GeneratedComment } from '../lib/domain'
import type { IncomingComment } from '../lib/reply-assistant'
import type { BrandVoiceSelection } from '../lib/brand-voice'
import { analyzeIncomingComment } from '../lib/reply-assistant'
import { detectLocationFromInput, getTimezoneOffset } from '../lib/location-utils'

export function EngagementPage() {
  const { brands, accounts } = useWorkspace()
  const { demo } = useAuth()
  const [campaigns, setCampaigns] = useState<CommentCampaign[]>([])
  const [opportunities, setOpportunities] = useState<CommentOpportunity[]>([])
  const [comments, setComments] = useState<GeneratedComment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!brands.length && !accounts.length) {
      setComments([])
      setCampaigns([])
      setOpportunities([])
    }
  }, [brands, accounts])

  const handleFindOpportunities = async () => {
    if (!demo) { setError('Поиск возможностей доступен только в демо-режиме'); return }
    setLoading(true)
    setError('')
    await new Promise((r) => setTimeout(r, 600))
    try {
      if (!accounts.length) { setError('Добавьте Threads-аккаунт для поиска возможностей'); return }
      const demo: CommentOpportunity = {
        id: 'demo-opp-1', campaign_id: null, brand_id: brands[0]?.id ?? '',
        threads_post_id: '123', author_username: 'almaty_business', author_id: null,
        post_text: 'Кто использует AI в малом бизнесе? Делитесь опытом в комментариях',
        topic: ['AI', 'бизнес', 'автоматизация'], language: 'ru', location: 'Алматы',
        freshness_hours: 2, conversation_activity: 23,
        opportunity_score: 84, topic_match: 80, audience_match: 75, location_match: 90,
        freshness_score: 75, activity_score: 70, toxicity_risk: 5, spam_risk: 8,
        lead_potential: 65, brand_fit_score: 85,
        status: 'found', source: 'keyword', created_at: new Date().toISOString(),
      }
      setOpportunities([demo, { ...demo, id: 'demo-opp-2', post_text: 'Что делать когда клиенты не платят вовремя?', conversation_activity: 12, opportunity_score: 67, topic: ['бизнес', 'клиенты', 'финансы'] }])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка поиска возможностей')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCampaign = async (c: Partial<CommentCampaign>) => {
    const now = new Date().toISOString()
    const brandId = brands[0]?.id ?? ''
    const campaign: CommentCampaign = {
      id: `camp-${Date.now()}`, brand_id: brandId,
      name: c.name || 'Новая кампания', goal: c.goal as CommentCampaign['goal'] || 'awareness',
      target_audience: { segments: [], locations: [], topics: [] },
      tone: c.tone as CommentCampaign['tone'] || 'expert', cta_style: c.cta_style as CommentCampaign['cta_style'] || 'none',
      forbidden_words: [], source_lists: [], rss_feeds: [], competitor_accounts: [], influencer_accounts: [],
      limits: c.limits as CommentCampaign['limits'] || { perDay: 15, perHour: 3, minInterval: 5 },
      approval_mode: c.approval_mode as CommentCampaign['approval_mode'] || 'approve_and_publish',
      status: 'active', schedule: {}, created_at: now, updated_at: now,
    }
    setCampaigns([...campaigns, campaign])
  }

  const handleApproveComment = async (commentId: string) => {
    setComments(comments.map((c) => c.id === commentId ? { ...c, status: 'approved' } : c))
  }

  const handleRejectComment = async (commentId: string) => {
    setComments(comments.map((c) => c.id === commentId ? { ...c, status: 'rejected' } : c))
  }

  if (loading) return (
    <AppShell title="Engagement Factory">
      <div className="page-content"><Spinner /></div>
    </AppShell>
  )

  return (
    <AppShell title="Engagement Factory">
      <div className="page-content">
        {error && <div className="toast toast-error" role="alert" style={{ position: 'static', marginBottom: '1rem' }}>{error}</div>}
        <EngagementFactory
          campaigns={campaigns}
          opportunities={opportunities}
          comments={comments}
          onSaveCampaign={handleSaveCampaign}
          onApproveComment={handleApproveComment}
          onRejectComment={handleRejectComment}
          onFindOpportunities={handleFindOpportunities}
        />
      </div>
    </AppShell>
  )
}

export function AudienceSegmentsPage() {
  const { brands } = useWorkspace()
  const [segments, setSegments] = useState<AudienceSegment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!brands.length) { setLoading(false); return }
    const timer = setTimeout(() => { setLoading(false) }, 300)
    return () => clearTimeout(timer)
  }, [brands])

  const handleSave = async (seg: Partial<AudienceSegment>) => {
    setError('')
    try {
      const now = new Date().toISOString()
      const brandId = brands[0]?.id ?? ''
      if (seg.id) {
        setSegments((items) => items.map((s) => s.id === seg.id ? { ...s, ...seg } as AudienceSegment : s))
      } else {
        const newSeg: AudienceSegment = {
          id: `seg-${Date.now()}`, brand_id: brandId,
          name: seg.name || 'Новый сегмент', segment_type: seg.segment_type as AudienceSegment['segment_type'] || 'entrepreneur',
          location_id: null, awareness_level: seg.awareness_level as AudienceSegment['awareness_level'] || 'cold',
          archetype: seg.archetype as AudienceSegment['archetype'] || 'pragmatic',
          pains: seg.pains || [], desires: seg.desires || [], triggers: seg.triggers || [],
          forbidden_topics: seg.forbidden_topics || [],
          communication: seg.communication as AudienceSegment['communication'] || { language: 'ru', formality: 50, boldness: 30, humor: 20, ctaFormulas: [], postFormats: [], forbiddenPhrases: [] },
          offer_mapping: seg.offer_mapping as AudienceSegment['offer_mapping'] || { primaryOffer: '', objections: [], valueProps: [], localReferences: [] },
          created_at: now, updated_at: now,
        }
        setSegments((items) => [...items, newSeg])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения сегмента')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      setSegments((items) => items.filter((s) => s.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка удаления сегмента')
    }
  }

  if (loading) return <AppShell title="Аудитории"><div className="page-content"><Spinner /></div></AppShell>

  return (
    <AppShell title="Аудитории">
      <div className="page-content">
        {error && <div className="toast toast-error" role="alert" style={{ position: 'static', marginBottom: '1rem' }}>{error}</div>}
        {segments.length === 0 ? (
          <EmptyState title="Нет сегментов" text="Создайте первый сегмент аудитории для лазерного таргетинга контента." />
        ) : (
          <AudienceManager segments={segments} onSave={handleSave} onDelete={handleDelete} />
        )}
      </div>
    </AppShell>
  )
}

export function LocationsPage() {
  const { brands } = useWorkspace()
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!brands.length) { setLoading(false); return }
    const timer = setTimeout(() => { setLoading(false) }, 300)
    return () => clearTimeout(timer)
  }, [brands])

  const handleSave = async (loc: Partial<Location>) => {
    setError('')
    try {
      const now = new Date().toISOString()
      const brandId = brands[0]?.id ?? ''
      if (loc.id) {
        setLocations((items) => items.map((l) => l.id === loc.id ? { ...l, ...loc } as Location : l))
      } else {
        const city = detectLocationFromInput(loc.name || '') ?? (loc.name || '')
        const country = loc.country || ''
        const timezone = getTimezoneOffset('Asia/Almaty') ? 'Asia/Almaty' : 'Europe/Moscow'
        const newLoc: Location = {
          id: `loc-${Date.now()}`, brand_id: brandId,
          name: loc.name || 'Новая локация', country: country, city: city, region: loc.region || null,
          currency: loc.currency || '₸', language: loc.language as Location['language'] || 'ru',
          formality: loc.formality ?? 50, timezone: timezone || 'Asia/Almaty',
          post_hours: loc.post_hours as Location['post_hours'] || { start: 10, end: 20 },
          local_examples: loc.local_examples || [], local_references: loc.local_references || [],
          local_context: loc.local_context || null, local_events: loc.local_events || [],
          local_business_terms: loc.local_business_terms || [],
          created_at: now, updated_at: now,
        }
        setLocations((items) => [...items, newLoc])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения локации')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      setLocations((items) => items.filter((l) => l.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка удаления локации')
    }
  }

  if (loading) return <AppShell title="Локации"><div className="page-content"><Spinner /></div></AppShell>

  return (
    <AppShell title="Локации">
      <div className="page-content">
        {error && <div className="toast toast-error" role="alert" style={{ position: 'static', marginBottom: '1rem' }}>{error}</div>}
        {locations.length === 0 ? (
          <EmptyState title="Нет локаций" text="Добавьте локации для гео-таргетинга контента." />
        ) : (
          <LocationSettings locations={locations} onSave={handleSave} onDelete={handleDelete} />
        )}
      </div>
    </AppShell>
  )
}

export function ReplyPage() {
  const { accounts } = useWorkspace()
  const { demo } = useAuth()
  const [comments, setComments] = useState<IncomingComment[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!demo) return
    if (!accounts.length) { setLoading(false); return }
    const timer = setTimeout(() => {
      const demoComment: IncomingComment = { id: 'r1', authorUsername: 'user123', text: 'Спасибо за пост! А как внедрить AI-аудит в небольшой компании?', postText: '', language: 'ru', sentiment: 'positive', intent: 'question', urgency: 'normal', isLead: true, createdAt: new Date().toISOString() }
      const analysis = analyzeIncomingComment(demoComment)
      setComments([
        { ...demoComment, sentiment: analysis.sentiment, intent: analysis.intent, urgency: analysis.urgency, isLead: analysis.isLead },
        { id: 'r2', authorUsername: 'ceo_kz', text: 'Не очень понял, как это применить к ритейлу', postText: '', language: 'ru', sentiment: 'negative', intent: 'feedback', urgency: 'high', isLead: false, createdAt: new Date().toISOString() },
      ])
      setLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [accounts, demo])

  const handleSendReply = async (commentId: string, _text: string) => {
    try {
      await new Promise((r) => setTimeout(r, 500))
      setComments((items) => items.filter((c) => c.id !== commentId))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка отправки ответа')
    }
  }

  if (loading) return <AppShell title="Ответы на комментарии"><div className="page-content"><Spinner /></div></AppShell>

  return (
    <AppShell title="Ответы на комментарии">
      <div className="page-content">
        {error && <div className="toast toast-error" role="alert" style={{ position: 'static', marginBottom: '1rem' }}>{error}</div>}
        {comments.length === 0 ? (
          <EmptyState title="Нет комментариев" text="Подключите Threads-аккаунт для отслеживания комментариев" />
        ) : (
          <ReplyAssistant comments={comments} onSendReply={handleSendReply} />
        )}
      </div>
    </AppShell>
  )
}

export function BrandProfilePage() {
  const { brands, saveBrand } = useWorkspace()
  const brand = brands[0]
  const [voice, setVoice] = useState<Partial<BrandVoiceSelection>>({})
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!brand) return
    setSaving(true)
    try {
      await saveBrand({
        ...brand,
        tone_of_voice: Object.entries(voice).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('; '),
      })
    } finally {
      setSaving(false)
    }
  }

  if (!brand) return (
    <AppShell title="Профиль бренда">
      <div className="page-content">
        <EmptyState title="Нет бренда" text="Создайте профиль бренда в разделе Аккаунты" />
      </div>
    </AppShell>
  )

  return (
    <AppShell title="Профиль бренда">
      <div className="page-content">
        <Card className="margin-card">
          <div className="stack-cards">
            <div className="card" style={{ padding: '1.5rem' }}>
              <div className="profile-head">
                <div className="brand-symbol">
                  <svg viewBox="0 0 24 24" width="36" height="36" fill="currentColor"><path d="M12 2L2 7v5c0 5.5 3.8 10.7 10 12 6.2-1.3 10-6.5 10-12V7l-10-5z" /></svg>
                </div>
                <div>
                  <h1>{brand.name}</h1>
                  <p>{brand.description}</p>
                </div>
              </div>
              <div className="brand-meta" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
                <span><strong>Ниша:</strong> {brand.niche}</span>
                <span><strong>Аудитория:</strong> {brand.audience}</span>
                <span><strong>Позиционирование:</strong> {brand.positioning}</span>
              </div>
            </div>
          </div>
          <BrandVoiceEditor value={voice} onChange={setVoice} />
          <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
            <Button onClick={handleSave} loading={saving}>Сохранить голос бренда</Button>
          </div>
        </Card>
      </div>
    </AppShell>
  )
}
