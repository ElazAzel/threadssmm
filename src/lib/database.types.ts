export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

type Relationship = {
  foreignKeyName: string
  columns: string[]
  isOneToOne: boolean
  referencedRelation: string
  referencedColumns: string[]
}

type Table<Row, Insert = Partial<Row>, Update = Partial<Insert>, Relationships extends Relationship[] = []> = {
  Row: Row & Record<string, unknown>
  Insert: Insert & Record<string, unknown>
  Update: Update & Record<string, unknown>
  Relationships: Relationships
}

export type WorkspaceRole = 'owner' | 'admin' | 'editor' | 'viewer'
export type ContentFormat = 'post' | 'thread' | 'reply' | 'content_plan' | 'strategy' | 'visual_prompt'
export type ContentStatus = 'idea' | 'draft' | 'pending_approval' | 'approved' | 'scheduled' | 'published' | 'failed' | 'rejected'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'changes_requested'
export type RiskLevel = 'low' | 'medium' | 'high' | 'blocked'
export type AccountStatus = 'pending' | 'active' | 'expired' | 'error' | 'manual'

export interface ProfileRow {
  id: string
  full_name: string
  locale: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface WorkspaceRow {
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

export interface WorkspaceMemberRow {
  workspace_id: string
  user_id: string
  role: WorkspaceRole
  created_at: string
}

export interface BrandRow {
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

export interface AiSettingsRow {
  workspace_id: string
  provider: string
  model: string
  temperature: number
  monthly_credit_limit: number
  created_at: string
  updated_at: string
}

export interface WorkspaceSettingsRow {
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

export interface ThreadsAccountRow {
  id: string
  workspace_id: string
  brand_id: string | null
  threads_user_id: string | null
  username: string
  display_name: string
  profile_picture_url: string | null
  status: AccountStatus
  permissions: string[]
  token_expires_at: string | null
  last_synced_at: string | null
  last_error: string | null
  created_at: string
  updated_at: string
}

export interface DraftRow {
  id: string
  workspace_id: string
  brand_id: string | null
  account_id: string | null
  created_by: string
  format: ContentFormat
  title: string
  content: string
  variants: Json
  selected_variant: string | null
  source: string
  status: ContentStatus
  risk_score: number
  risk_level: RiskLevel
  compliance_notes: Json
  scheduled_at: string | null
  published_at: string | null
  threads_post_id: string | null
  error_message: string | null
  metadata: Json
  created_at: string
  updated_at: string
}

export interface ApprovalRow {
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

export interface MediaAssetRow {
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
  metadata: Json
  created_at: string
}

export interface MonitorSourceRow {
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

export interface MonitorItemRow {
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

export interface PostMetricRow {
  id: string
  workspace_id: string
  draft_id: string
  captured_at: string
  views: number
  likes: number
  replies: number
  reposts: number
  quotes: number
  clicks: number
  followers_delta: number
  raw: Json
}

export interface UsageEventRow {
  id: string
  workspace_id: string
  user_id: string
  provider: string
  model: string
  operation: string
  input_tokens: number
  output_tokens: number
  credits: number
  metadata: Json
  created_at: string
}

export interface AuditLogRow {
  id: string
  workspace_id: string
  actor_id: string | null
  action: string
  resource_type: string
  resource_id: string | null
  risk: RiskLevel
  details: Json
  created_at: string
}

type WorkspaceInsert = Pick<WorkspaceRow, 'owner_id' | 'name' | 'slug'> & Partial<Omit<WorkspaceRow, 'id' | 'owner_id' | 'name' | 'slug'>> & { id?: string }
type BrandInsert = Pick<BrandRow, 'workspace_id' | 'name'> & Partial<Omit<BrandRow, 'id' | 'workspace_id' | 'name'>> & { id?: string }
type AccountInsert = Pick<ThreadsAccountRow, 'workspace_id' | 'username'> & Partial<Omit<ThreadsAccountRow, 'id' | 'workspace_id' | 'username'>> & { id?: string }
type DraftInsert = Pick<DraftRow, 'workspace_id' | 'created_by'> & Partial<Omit<DraftRow, 'id' | 'workspace_id' | 'created_by'>> & { id?: string }
type ApprovalInsert = Pick<ApprovalRow, 'workspace_id' | 'draft_id' | 'requested_by'> & Partial<Omit<ApprovalRow, 'id' | 'workspace_id' | 'draft_id' | 'requested_by'>> & { id?: string }
type MediaAssetInsert = Pick<MediaAssetRow, 'workspace_id' | 'created_by' | 'title' | 'storage_path' | 'mime_type'> & Partial<Omit<MediaAssetRow, 'id' | 'workspace_id' | 'created_by' | 'title' | 'storage_path' | 'mime_type'>> & { id?: string }
type MonitorSourceInsert = Pick<MonitorSourceRow, 'workspace_id' | 'type' | 'name' | 'value'> & Partial<Omit<MonitorSourceRow, 'id' | 'workspace_id' | 'type' | 'name' | 'value'>> & { id?: string }
type MonitorItemInsert = Pick<MonitorItemRow, 'workspace_id' | 'url' | 'title'> & Partial<Omit<MonitorItemRow, 'id' | 'workspace_id' | 'url' | 'title'>> & { id?: string }
type UsageEventInsert = Pick<UsageEventRow, 'workspace_id' | 'user_id' | 'provider' | 'model' | 'operation'> & Partial<Omit<UsageEventRow, 'id' | 'workspace_id' | 'user_id' | 'provider' | 'model' | 'operation'>> & { id?: string }
type AuditLogInsert = Pick<AuditLogRow, 'workspace_id' | 'action' | 'resource_type'> & Partial<Omit<AuditLogRow, 'id' | 'workspace_id' | 'action' | 'resource_type'>> & { id?: string }

export interface Database {
  __InternalSupabase: {
    PostgrestVersion: '14.1'
  }
  public: {
    Tables: {
      profiles: Table<ProfileRow>
      workspaces: Table<WorkspaceRow, WorkspaceInsert>
      workspace_members: Table<WorkspaceMemberRow, Pick<WorkspaceMemberRow, 'workspace_id' | 'user_id'> & Partial<Pick<WorkspaceMemberRow, 'role' | 'created_at'>>>
      brands: Table<BrandRow, BrandInsert>
      ai_settings: Table<AiSettingsRow, Pick<AiSettingsRow, 'workspace_id'> & Partial<Omit<AiSettingsRow, 'workspace_id'>>>
      workspace_settings: Table<WorkspaceSettingsRow, Pick<WorkspaceSettingsRow, 'workspace_id'> & Partial<Omit<WorkspaceSettingsRow, 'workspace_id'>>>
      threads_accounts: Table<ThreadsAccountRow, AccountInsert>
      drafts: Table<DraftRow, DraftInsert>
      approvals: Table<ApprovalRow, ApprovalInsert>
      media_assets: Table<MediaAssetRow, MediaAssetInsert>
      monitor_sources: Table<MonitorSourceRow, MonitorSourceInsert>
      monitor_items: Table<MonitorItemRow, MonitorItemInsert>
      post_metrics: Table<PostMetricRow, Pick<PostMetricRow, 'workspace_id' | 'draft_id'> & Partial<Omit<PostMetricRow, 'id' | 'workspace_id' | 'draft_id'>> & { id?: string }>
      usage_events: Table<UsageEventRow, UsageEventInsert>
      audit_logs: Table<AuditLogRow, AuditLogInsert>
    }
    Views: Record<never, never>
    Functions: {
      check_api_rate_limit: {
        Args: { p_bucket: string; p_identity_hash: string; p_limit: number; p_window_seconds: number }
        Returns: { allowed: boolean; remaining: number; retry_after_seconds: number }[]
      }
      create_workspace_with_defaults: {
        Args: { p_name: string; p_slug: string; p_region: string; p_locale: string; p_timezone: string; p_brand_name: string; p_niche: string; p_audience: string; p_goal: string; p_threads_username?: string | null }
        Returns: WorkspaceRow
      }
      get_threads_token: { Args: { p_account_id: string }; Returns: { access_token: string; expires_at: string | null }[] }
      refund_ai_credit: { Args: { p_workspace_id: string }; Returns: number }
      request_draft_approval: { Args: { p_draft_id: string; p_reason?: string }; Returns: ApprovalRow }
      reserve_ai_credit: { Args: { p_workspace_id: string }; Returns: number }
      review_draft_approval: { Args: { p_approval_id: string; p_status: ApprovalStatus; p_note?: string }; Returns: ApprovalRow }
      store_threads_token: { Args: { p_account_id: string; p_access_token: string; p_expires_at: string | null }; Returns: undefined }
    }
    Enums: {
      workspace_role: WorkspaceRole
      content_format: ContentFormat
      content_status: ContentStatus
      approval_status: ApprovalStatus
      risk_level: RiskLevel
      account_status: AccountStatus
    }
    CompositeTypes: Record<never, never>
  }
}
