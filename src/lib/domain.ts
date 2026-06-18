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
