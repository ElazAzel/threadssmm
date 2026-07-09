import { useState } from 'react'
import { AppShell } from '../components/AppShell'
import { EngagementFactory } from '../components/EngagementFactory'
import { AudienceManager } from '../components/AudienceManager'
import { LocationSettings } from '../components/LocationSettings'
import { ReplyAssistant } from '../components/ReplyAssistant'
import { BrandVoiceEditor } from '../components/BrandVoiceEditor'
import { Button, Card } from '../components/ui'
import { useWorkspace } from '../contexts/WorkspaceContext'
import type { AudienceSegment, Location, CommentCampaign, CommentOpportunity, GeneratedComment } from '../lib/domain'
import type { BrandVoiceSelection } from '../lib/brand-voice'

export function EngagementPage() {
  const { brands } = useWorkspace()
  const [campaigns, setCampaigns] = useState<CommentCampaign[]>([])
  const [opportunities, setOpportunities] = useState<CommentOpportunity[]>([])
  const [comments, setComments] = useState<GeneratedComment[]>([])

  const handleFindOpportunities = async () => {
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
  }

  const handleSaveCampaign = async (c: Partial<CommentCampaign>) => {
    const campaign: CommentCampaign = {
      id: `camp-${Date.now()}`, brand_id: brands[0]?.id ?? '',
      name: c.name || 'Новая кампания', goal: c.goal as CommentCampaign['goal'] || 'awareness',
      target_audience: { segments: [], locations: [], topics: [] },
      tone: c.tone as CommentCampaign['tone'] || 'expert', cta_style: c.cta_style as CommentCampaign['cta_style'] || 'none',
      forbidden_words: [], source_lists: [], rss_feeds: [], competitor_accounts: [], influencer_accounts: [],
      limits: c.limits as CommentCampaign['limits'] || { perDay: 15, perHour: 3, minInterval: 5 },
      approval_mode: c.approval_mode as CommentCampaign['approval_mode'] || 'approve_and_publish',
      status: 'active', schedule: {}, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }
    setCampaigns([...campaigns, campaign])
  }

  const handleApproveComment = async (commentId: string) => {
    setComments(comments.map(c => c.id === commentId ? { ...c, status: 'approved' } : c))
  }

  const handleRejectComment = async (commentId: string) => {
    setComments(comments.map(c => c.id === commentId ? { ...c, status: 'rejected' } : c))
  }

  return (
    <AppShell title="Engagement Factory">
      <div className="page-content">
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

  const handleSave = async (seg: Partial<AudienceSegment>) => {
    const now = new Date().toISOString()
    if (seg.id) {
      setSegments(segments.map(s => s.id === seg.id ? { ...s, ...seg } as AudienceSegment : s))
    } else {
      const newSeg: AudienceSegment = {
        id: `seg-${Date.now()}`, brand_id: brands[0]?.id ?? '',
        name: seg.name || 'Новый сегмент', segment_type: seg.segment_type as AudienceSegment['segment_type'] || 'entrepreneur',
        location_id: null, awareness_level: seg.awareness_level as AudienceSegment['awareness_level'] || 'cold',
        archetype: seg.archetype as AudienceSegment['archetype'] || 'pragmatic',
        pains: seg.pains || [], desires: seg.desires || [], triggers: seg.triggers || [],
        forbidden_topics: seg.forbidden_topics || [],
        communication: seg.communication as AudienceSegment['communication'] || { language: 'ru', formality: 50, boldness: 30, humor: 20, ctaFormulas: [], postFormats: [], forbiddenPhrases: [] },
        offer_mapping: seg.offer_mapping as AudienceSegment['offer_mapping'] || { primaryOffer: '', objections: [], valueProps: [], localReferences: [] },
        created_at: now, updated_at: now,
      }
      setSegments([...segments, newSeg])
    }
  }

  const handleDelete = async (id: string) => {
    setSegments(segments.filter(s => s.id !== id))
  }

  return (
    <AppShell title="Аудитории">
      <div className="page-content">
        <AudienceManager segments={segments} onSave={handleSave} onDelete={handleDelete} />
      </div>
    </AppShell>
  )
}

export function LocationsPage() {
  const { brands } = useWorkspace()
  const [locations, setLocations] = useState<Location[]>([])

  const handleSave = async (loc: Partial<Location>) => {
    const now = new Date().toISOString()
    if (loc.id) {
      setLocations(locations.map(l => l.id === loc.id ? { ...l, ...loc } as Location : l))
    } else {
      const newLoc: Location = {
        id: `loc-${Date.now()}`, brand_id: brands[0]?.id ?? '',
        name: loc.name || 'Новая локация', country: loc.country || null, city: loc.city || null, region: loc.region || null,
        currency: loc.currency || '₸', language: loc.language as Location['language'] || 'ru',
        formality: loc.formality ?? 50, timezone: loc.timezone || 'Asia/Almaty',
        post_hours: loc.post_hours as Location['post_hours'] || { start: 10, end: 20 },
        local_examples: loc.local_examples || [], local_references: loc.local_references || [],
        local_context: loc.local_context || null, local_events: loc.local_events || [],
        local_business_terms: loc.local_business_terms || [],
        created_at: now, updated_at: now,
      }
      setLocations([...locations, newLoc])
    }
  }

  const handleDelete = async (id: string) => {
    setLocations(locations.filter(l => l.id !== id))
  }

  return (
    <AppShell title="Локации">
      <div className="page-content">
        <LocationSettings locations={locations} onSave={handleSave} onDelete={handleDelete} />
      </div>
    </AppShell>
  )
}

export function ReplyPage() {
  const [comments, setComments] = useState([
    { id: 'r1', authorUsername: 'user123', text: 'Спасибо за пост! А как внедрить AI-аудит в небольшой компании?', postText: '', language: 'ru', sentiment: 'positive' as const, intent: 'question' as const, urgency: 'normal' as const, isLead: true, createdAt: new Date().toISOString() },
    { id: 'r2', authorUsername: 'ceo_kz', text: 'Не очень понял, как это применить к ритейлу', postText: '', language: 'ru', sentiment: 'negative' as const, intent: 'feedback' as const, urgency: 'high' as const, isLead: false, createdAt: new Date().toISOString() },
  ])

  const handleSendReply = async (commentId: string, _text: string) => {
    await new Promise(r => setTimeout(r, 500))
    setComments(comments.filter(c => c.id !== commentId))
  }

  return (
    <AppShell title="Ответы на комментарии">
      <div className="page-content">
        <ReplyAssistant comments={comments} onSendReply={handleSendReply} />
      </div>
    </AppShell>
  )
}

export function BrandProfilePage() {
  const { brands, saveBrand } = useWorkspace()
  const brand = brands[0]
  const [voice, setVoice] = useState<Partial<BrandVoiceSelection>>({})

  const handleSave = async () => {
    if (!brand) return
    await saveBrand({
      ...brand,
      tone_of_voice: Object.entries(voice).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('; '),
    })
  }

  return (
    <AppShell title="Профиль бренда">
      <div className="page-content">
        <Card className="brand-profile-card">
          {brand && (
            <div className="brand-info">
              <h2>{brand.name}</h2>
              <p>{brand.description}</p>
              <div className="brand-meta">
                <span>Ниша: {brand.niche}</span>
                <span>Аудитория: {brand.audience}</span>
                <span>Позиционирование: {brand.positioning}</span>
              </div>
            </div>
          )}
          <BrandVoiceEditor value={voice} onChange={setVoice} />
          <div className="form-actions">
            <Button onClick={handleSave}>Сохранить голос бренда</Button>
          </div>
        </Card>
      </div>
    </AppShell>
  )
}
