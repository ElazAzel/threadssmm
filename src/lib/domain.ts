export type RiskLevel = 'low' | 'medium' | 'high' | 'blocked'
export type ContentStatus = 'idea' | 'draft' | 'pending_approval' | 'approved' | 'scheduled' | 'published' | 'failed' | 'rejected'
export type ContentFormat = 'post' | 'thread' | 'reply' | 'content_plan' | 'strategy' | 'visual_prompt'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'changes_requested'

export interface Workspace {
  id: string
  owner_id: string
  name: string
  slug: string
  region: string
  locale: string
  timezone: string
  plan: string
  ai_credits: number
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export interface Brand {
  id: string
  workspace_id: string
  name: string
  description: string
  niche: string
  product: string
  website: string | null
  geography: string
  language: string
  audience: string
  icp: string
  competitors: string[]
  positioning: string
  usp: string
  goals: string[]
  forbidden_topics: string[]
  allowed_topics: string[]
  tone_of_voice: string
  content_pillars: string[]
  ctas: string[]
  good_examples: string
  bad_examples: string
  reply_style: string
  negative_response_rules: string
  risk_tolerance: number
  loved_words: string[]
  hated_words: string[]
  cta_style: 'none' | 'soft' | 'direct' | 'question'
  humor_style: 'none' | 'subtle' | 'friendly' | 'playful' | 'sarcastic'
  boldness_level: number
  formality_level: number
  reply_style_guide: string
  brand_archetype: '' | 'creator' | 'caregiver' | 'ruler' | 'jester' | 'sage' | 'hero' | 'outlaw' | 'magician' | 'regular_guy' | 'lover' | 'explorer' | 'innocent'
  created_at: string
  updated_at: string
}

export interface ThreadAccount {
  id: string
  workspace_id: string
  brand_id: string | null
  threads_user_id: string | null
  username: string
  display_name: string
  profile_picture_url: string | null
  status: 'pending' | 'active' | 'expired' | 'error' | 'manual'
  permissions: string[]
  token_expires_at: string | null
  last_synced_at: string | null
  last_error: string | null
  created_at: string
  updated_at: string
}

export interface GeneratedVariant {
  id: string
  label: string
  content: string
  tone: string
  hookScore: number
  complianceScore: number
}

export interface Draft {
  id: string
  workspace_id: string
  brand_id: string | null
  account_id: string | null
  created_by: string
  format: ContentFormat
  title: string
  content: string
  variants: GeneratedVariant[]
  selected_variant: string | null
  source: string
  status: ContentStatus
  risk_score: number
  risk_level: RiskLevel
  compliance_notes: string[]
  scheduled_at: string | null
  published_at: string | null
  threads_post_id: string | null
  error_message: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Approval {
  id: string
  workspace_id: string
  draft_id: string
  requested_by: string
  status: ApprovalStatus
  reason: string
  decision_note: string
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

export interface MediaAsset {
  id: string
  workspace_id: string
  brand_id: string | null
  created_by: string
  title: string
  storage_path: string
  mime_type: string
  size_bytes: number
  width: number | null
  height: number | null
  source: string
  prompt: string
  metadata: Record<string, unknown>
  created_at: string
  url: string
}

export interface MonitorSource {
  id: string
  workspace_id: string
  brand_id: string | null
  type: 'rss' | 'keyword' | 'account' | 'manual_url'
  name: string
  value: string
  active: boolean
  last_checked_at: string | null
  last_error: string | null
  created_at: string
  updated_at: string
}

export interface MonitorItem {
  id: string
  workspace_id: string
  source_id: string | null
  external_id: string | null
  url: string
  author: string
  title: string
  summary: string
  published_at: string | null
  relevance_score: number
  urgency: 'low' | 'normal' | 'high' | 'urgent'
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed'
  recommendation: 'reply' | 'comment' | 'post' | 'thread' | 'ignore'
  ai_reasoning: string
  dismissed: boolean
  created_at: string
}

export interface WorkspaceSettings {
  workspace_id: string
  security_enabled: boolean
  security_policy: 'standard' | 'strict' | 'custom'
  ai_enabled: boolean
  ai_policy: 'standard' | 'strict' | 'custom'
  notifications_enabled: boolean
  notifications_policy: 'standard' | 'strict' | 'custom'
  audit_enabled: boolean
  audit_policy: 'standard' | 'strict' | 'custom'
  created_at: string
  updated_at: string
}

export interface AuditLog {
  id: string
  workspace_id: string
  actor_id: string | null
  action: string
  resource_type: string
  resource_id: string | null
  risk: RiskLevel
  details: Record<string, unknown>
  created_at: string
}

export interface AudienceSegment {
  id: string
  brand_id: string
  name: string
  segment_type: 'entrepreneur' | 'startup_founder' | 'student' | 'marketer' | 'smm' | 'hr' | 'ceo' | 'small_business' | 'corp' | 'university' | 'investor' | 'developer' | 'designer' | 'creator'
  location_id: string | null
  awareness_level: 'cold' | 'warm' | 'hot' | 'client' | 'partner' | 'community'
  archetype: 'pragmatic' | 'ambitious' | 'skeptic' | 'beginner' | 'expert' | 'tech_lover'
  pains: string[]
  desires: string[]
  triggers: string[]
  forbidden_topics: string[]
  communication: {
    language: string
    formality: number
    boldness: number
    humor: number
    ctaFormulas: string[]
    postFormats: string[]
    forbiddenPhrases: string[]
  }
  offer_mapping: {
    primaryOffer: string
    objections: string[]
    valueProps: string[]
    localReferences: string[]
  }
  created_at: string
  updated_at: string
}

export interface Location {
  id: string
  brand_id: string
  name: string
  country: string | null
  city: string | null
  region: string | null
  currency: string
  language: 'ru' | 'kk' | 'en'
  formality: number
  timezone: string
  post_hours: { start: number; end: number }
  local_examples: string[]
  local_references: string[]
  local_context: string | null
  local_events: string[]
  local_business_terms: string[]
  created_at: string
  updated_at: string
}

export interface ContentPillar {
  id: string
  brand_id: string
  name: string
  goal: string | null
  audience_segments: string[]
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly'
  style: string | null
  cta_template: string | null
  examples: string[]
  risk_level: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CommentCampaign {
  id: string
  brand_id: string
  name: string
  goal: 'awareness' | 'leads' | 'expertise' | 'local_domination' | 'trend_hijacking' | 'community'
  target_audience: {
    segments: string[]
    locations: string[]
    topics: string[]
  }
  tone: 'expert' | 'friendly' | 'ironic' | 'supportive' | 'controversial'
  cta_style: 'none' | 'soft' | 'direct'
  forbidden_words: string[]
  source_lists: string[]
  rss_feeds: string[]
  competitor_accounts: string[]
  influencer_accounts: string[]
  limits: { perDay: number; perHour: number; minInterval: number }
  approval_mode: 'draft_only' | 'approve_and_publish' | 'manual_copy' | 'team_approval'
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived'
  schedule: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface CommentOpportunity {
  id: string
  campaign_id: string | null
  brand_id: string
  threads_post_id: string
  author_id: string | null
  author_username: string | null
  post_text: string | null
  topic: string[]
  language: string | null
  location: string | null
  freshness_hours: number | null
  conversation_activity: number
  opportunity_score: number
  topic_match: number
  audience_match: number
  location_match: number
  freshness_score: number
  activity_score: number
  toxicity_risk: number
  spam_risk: number
  lead_potential: number
  brand_fit_score: number
  status: 'found' | 'proposed' | 'reviewed' | 'approved' | 'published' | 'rejected' | 'dismissed'
  source: 'rss' | 'user_list' | 'competitor' | 'influencer' | 'keyword' | 'trend' | 'manual'
  created_at: string
}

export interface GeneratedComment {
  id: string
  opportunity_id: string
  text: string
  tone: 'expert' | 'short' | 'question' | 'supportive' | 'soft_cta'
  risk_score: number
  brand_fit_score: number
  uniqueness_score: number
  relevance_score: number
  is_best: boolean
  status: 'proposed' | 'approved' | 'rejected' | 'published' | 'failed'
  published_at: string | null
  threads_reply_id: string | null
  error_message: string | null
  created_at: string
}

export interface RiskAssessment {
  id: string
  brand_id: string
  target_type: 'post' | 'comment' | 'draft' | 'campaign'
  target_id: string
  score: number
  verdict: 'safe' | 'low_risk' | 'needs_review' | 'high_risk' | 'blocked'
  factors: Record<string, number>
  warnings: string[]
  recommendations: string[]
  created_at: string
}

export interface AiGenerationLog {
  id: string
  brand_id: string | null
  agent_name: string
  input_hash: string | null
  output_hash: string | null
  model: string
  tokens_input: number
  tokens_output: number
  latency_ms: number
  success: boolean
  error: string | null
  created_at: string
}

export interface RateLimit {
  id: string
  brand_id: string
  account_id: string | null
  action_type: 'publish' | 'reply' | 'comment'
  window_start: string
  window_end: string
  current_count: number
  limit_value: number
}

export interface OnboardingInput {
  workspaceName: string
  region: string
  locale: string
  timezone: string
  brandName: string
  niche: string
  audience: string
  goal: string
  firstResult: string
  manualThreadsHandle?: string
}
