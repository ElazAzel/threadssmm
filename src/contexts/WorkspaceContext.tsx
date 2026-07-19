/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Approval, ApprovalStatus, AuditLog, Brand, ContentFormat, Draft, MediaAsset, MonitorItem, MonitorSource, OnboardingInput, ThreadAccount, Workspace, WorkspaceSettings } from '../lib/domain'
import type { DraftRow, Json, WorkspaceRole } from '../lib/database.types'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

interface WorkspaceContextValue {
  workspace: Workspace | null
  brands: Brand[]
  accounts: ThreadAccount[]
  drafts: Draft[]
  approvals: Approval[]
  mediaAssets: MediaAsset[]
  monitorSources: MonitorSource[]
  monitorItems: MonitorItem[]
  workspaceSettings: WorkspaceSettings | null
  auditLogs: AuditLog[]
  loading: boolean
  error: string
  refresh: () => Promise<void>
  createWorkspace: (input: OnboardingInput) => Promise<void>
  updateWorkspace: (changes: Partial<Pick<Workspace, 'name' | 'region' | 'timezone'>>) => Promise<void>
  saveWorkspaceSettings: (changes: Partial<WorkspaceSettings>) => Promise<void>
  createBrand: (name: string) => Promise<Brand>
  saveBrand: (brand: Brand) => Promise<void>
  addManualAccount: (username: string, brandId?: string | null) => Promise<ThreadAccount>
  updateAccount: (accountId: string, changes: Partial<Pick<ThreadAccount, 'brand_id' | 'display_name'>>) => Promise<void>
  deleteAccount: (accountId: string) => Promise<void>
  createQuickDraft: (content: string, format?: ContentFormat, source?: string) => Promise<Draft>
  updateDraft: (draftId: string, changes: Partial<Pick<Draft, 'title' | 'content' | 'status' | 'risk_score' | 'risk_level' | 'scheduled_at'>>) => Promise<void>
  requestApproval: (draftId: string, reason?: string) => Promise<void>
  reviewApproval: (approvalId: string, status: ApprovalStatus, note?: string) => Promise<void>
  uploadMedia: (file: File, title?: string, brandId?: string | null) => Promise<MediaAsset>
  deleteMedia: (asset: MediaAsset) => Promise<void>
  deleteMonitorSource: (sourceId: string) => Promise<void>
  dismissMonitorItem: (itemId: string) => Promise<void>
  deleteBrand: (brandId: string) => Promise<void>
  deleteDraft: (draftId: string) => Promise<void>
  teamMembers: { id: string; email: string; name: string; role: WorkspaceRole }[]
  inviteTeamMember: (email: string, role: string) => Promise<void>
  updateTeamMemberRole: (memberId: string, role: string) => Promise<void>
  removeTeamMember: (memberId: string) => Promise<void>
}

const now = new Date().toISOString()
const demoWorkspace: Workspace = {
  id: '10000000-0000-4000-8000-000000000001',
  owner_id: '00000000-0000-4000-8000-000000000001',
  name: 'TechNova Growth',
  slug: 'technova-growth',
  region: 'СНГ',
  locale: 'ru',
  timezone: 'Asia/Qyzylorda',
  plan: 'free',
  ai_credits: 200,
  onboarding_completed: true,
  created_at: now,
  updated_at: now,
}

const demoBrand: Brand = {
  id: '20000000-0000-4000-8000-000000000001',
  workspace_id: demoWorkspace.id,
  name: 'TechNova',
  description: 'AI-платформа для технологических команд.',
  niche: 'B2B SaaS / Developer Tools',
  product: 'Платформа автоматизации инфраструктуры',
  website: 'https://technova.example',
  geography: 'СНГ и Европа',
  language: 'ru',
  audience: 'CTO, engineering leads и продуктовые команды',
  icp: 'Технологические компании от 20 до 500 сотрудников',
  competitors: [],
  positioning: 'Практичная автоматизация без потери контроля',
  usp: 'Сокращает время настройки инфраструктуры на 80%',
  goals: ['Экспертность', 'Лиды'],
  forbidden_topics: ['Непроверенные цифры', 'Политика'],
  allowed_topics: ['DevTools', 'AI', 'Инфраструктура'],
  tone_of_voice: 'Технический, уверенный и конкретный',
  content_pillars: ['Практика', 'Продукт', 'Индустрия'],
  ctas: ['Попробовать продукт', 'Обсудить задачу'],
  good_examples: '',
  bad_examples: '',
  reply_style: 'Коротко и по существу',
  negative_response_rules: 'Не спорить, уточнять факты и предлагать решение',
  risk_tolerance: 45,
  loved_words: ['автоматизация', 'инновации', 'эффективность'],
  hated_words: ['синергия', 'революционный'],
  cta_style: 'soft',
  humor_style: 'subtle',
  boldness_level: 40,
  formality_level: 60,
  reply_style_guide: 'Коротко и по существу, с технической точностью',
  brand_archetype: 'sage',
  created_at: now,
  updated_at: now,
}

const demoAccount: ThreadAccount = {
  id: '30000000-0000-4000-8000-000000000001',
  workspace_id: demoWorkspace.id,
  brand_id: demoBrand.id,
  threads_user_id: null,
  username: 'technova_team',
  display_name: 'TechNova',
  profile_picture_url: null,
  status: 'manual',
  permissions: [],
  token_expires_at: null,
  last_synced_at: null,
  last_error: null,
  created_at: now,
  updated_at: now,
}

const demoWorkspaceSettings: WorkspaceSettings = {
  workspace_id: demoWorkspace.id,
  security_enabled: true,
  security_policy: 'standard',
  ai_enabled: true,
  ai_policy: 'standard',
  notifications_enabled: true,
  notifications_policy: 'standard',
  audit_enabled: true,
  audit_policy: 'strict',
  created_at: now,
  updated_at: now,
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

function slugify(value: string) {
  const base = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'workspace'
  return `${base}-${crypto.randomUUID().slice(0, 8)}`
}

function isRecord(value: Json): value is { [key: string]: Json | undefined } {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function normalizeDraft(row: DraftRow): Draft {
  const variants = Array.isArray(row.variants) ? row.variants.flatMap((value) => {
    if (!isRecord(value) || typeof value.id !== 'string' || typeof value.content !== 'string') return []
    return [{
      id: value.id,
      label: typeof value.label === 'string' ? value.label : value.id,
      content: value.content,
      tone: typeof value.tone === 'string' ? value.tone : '',
      hookScore: typeof value.hookScore === 'number' ? value.hookScore : 0,
      complianceScore: typeof value.complianceScore === 'number' ? value.complianceScore : 0,
    }]
  }) : []
  const complianceNotes = Array.isArray(row.compliance_notes)
    ? row.compliance_notes.filter((value): value is string => typeof value === 'string')
    : []
  const metadata = isRecord(row.metadata) ? row.metadata as Record<string, unknown> : {}
  return { ...row, variants, compliance_notes: complianceNotes, metadata }
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading, demo } = useAuth()
  const [workspace, setWorkspace] = useState<Workspace | null>(demo ? demoWorkspace : null)
  const [brands, setBrands] = useState<Brand[]>(demo ? [demoBrand] : [])
  const [accounts, setAccounts] = useState<ThreadAccount[]>(demo ? [demoAccount] : [])
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([])
  const [monitorSources, setMonitorSources] = useState<MonitorSource[]>([])
  const [monitorItems, setMonitorItems] = useState<MonitorItem[]>([])
  const [workspaceSettings, setWorkspaceSettings] = useState<WorkspaceSettings | null>(demo ? demoWorkspaceSettings : null)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(!demo)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    if (demo || authLoading) return
    if (!user || !supabase) {
      setWorkspace(null)
      setBrands([])
      setAccounts([])
      setDrafts([])
      setApprovals([])
      setMediaAssets([])
      setMonitorSources([])
      setMonitorItems([])
      setWorkspaceSettings(null)
      setAuditLogs([])
      setLoading(false)
      return
    }

    const client = supabase
    setLoading(true)
    setError('')
    const membershipResult = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (membershipResult.error) {
      setError(membershipResult.error.message)
      setLoading(false)
      return
    }

    const workspaceId = membershipResult.data?.workspace_id
    const workspaceResult = workspaceId
      ? await supabase.from('workspaces').select('*').eq('id', workspaceId).single()
      : { data: null, error: null }
    if (workspaceResult.error) {
      setError(workspaceResult.error.message)
      setLoading(false)
      return
    }
    const nextWorkspace = workspaceResult.data as Workspace | null
    setWorkspace(nextWorkspace)
    if (!nextWorkspace) {
      setBrands([])
      setAccounts([])
      setDrafts([])
      setApprovals([])
      setMediaAssets([])
      setMonitorSources([])
      setMonitorItems([])
      setWorkspaceSettings(null)
      setAuditLogs([])
      setLoading(false)
      return
    }

    const [brandResult, accountResult, draftResult, approvalResult, mediaResult, sourceResult, itemResult, settingsResult, auditResult] = await Promise.all([
      supabase.from('brands').select('*').eq('workspace_id', nextWorkspace.id).order('created_at'),
      supabase.from('threads_accounts').select('*').eq('workspace_id', nextWorkspace.id).order('created_at'),
      supabase.from('drafts').select('*').eq('workspace_id', nextWorkspace.id).order('created_at', { ascending: false }),
      supabase.from('approvals').select('*').eq('workspace_id', nextWorkspace.id).order('created_at', { ascending: false }),
      supabase.from('media_assets').select('*').eq('workspace_id', nextWorkspace.id).order('created_at', { ascending: false }),
      supabase.from('monitor_sources').select('*').eq('workspace_id', nextWorkspace.id).order('created_at', { ascending: false }),
      supabase.from('monitor_items').select('*').eq('workspace_id', nextWorkspace.id).eq('dismissed', false).order('published_at', { ascending: false }).limit(100),
      supabase.from('workspace_settings').select('*').eq('workspace_id', nextWorkspace.id).maybeSingle(),
      supabase.from('audit_logs').select('*').eq('workspace_id', nextWorkspace.id).order('created_at', { ascending: false }).limit(100),
    ])

    const firstError = brandResult.error ?? accountResult.error ?? draftResult.error ?? approvalResult.error ?? mediaResult.error ?? sourceResult.error ?? itemResult.error ?? settingsResult.error ?? auditResult.error
    if (firstError) setError(firstError.message)
    setBrands((brandResult.data ?? []) as unknown as Brand[])
    setAccounts((accountResult.data ?? []) as ThreadAccount[])
    setDrafts((draftResult.data ?? []).map(normalizeDraft))
    setApprovals((approvalResult.data ?? []) as Approval[])
    const mediaRows = mediaResult.data ?? []
    const mediaWithUrls = await Promise.all(mediaRows.map(async (row) => {
      const signed = await client.storage.from('media-assets').createSignedUrl(row.storage_path, 60 * 60)
      return { ...row, url: signed.data?.signedUrl ?? '' } as MediaAsset
    }))
    setMediaAssets(mediaWithUrls)
    setMonitorSources((sourceResult.data ?? []) as MonitorSource[])
    setMonitorItems((itemResult.data ?? []) as MonitorItem[])
    setWorkspaceSettings(settingsResult.data as WorkspaceSettings | null)
    setAuditLogs((auditResult.data ?? []) as AuditLog[])
    setLoading(false)
  }, [authLoading, demo, user])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const createWorkspace = useCallback(async (input: OnboardingInput) => {
    if (!user) throw new Error('Сначала войдите в аккаунт')
    if (demo) {
      setWorkspace({ ...demoWorkspace, name: input.workspaceName })
      setBrands([{ ...demoBrand, name: input.brandName, niche: input.niche, audience: input.audience, goals: [input.goal] }])
      if (input.manualThreadsHandle) setAccounts([{ ...demoAccount, username: input.manualThreadsHandle.replace(/^@/, '') }])
      return
    }
    if (!supabase) throw new Error('Supabase не настроен')

    const { error: workspaceError } = await supabase.rpc('create_workspace_with_defaults', {
      p_name: input.workspaceName.trim(),
      p_slug: slugify(input.workspaceName),
      p_region: input.region,
      p_locale: input.locale,
      p_timezone: input.timezone,
      p_brand_name: input.brandName.trim(),
      p_niche: input.niche.trim(),
      p_audience: input.audience.trim(),
      p_goal: input.goal,
      p_threads_username: input.manualThreadsHandle?.trim() || null,
    })
    if (workspaceError) throw workspaceError
    await refresh()
  }, [demo, refresh, user])

  const updateWorkspace = useCallback(async (changes: Partial<Pick<Workspace, 'name' | 'region' | 'timezone'>>) => {
    if (!workspace) throw new Error('Рабочее пространство не готово')
    if (demo) {
      setWorkspace({ ...workspace, ...changes, updated_at: new Date().toISOString() })
      return
    }
    if (!supabase) throw new Error('Supabase не настроен')
    const { data, error: updateError } = await supabase.from('workspaces').update(changes).eq('id', workspace.id).select('*').single()
    if (updateError) throw updateError
    setWorkspace(data as Workspace)
  }, [demo, workspace])

  const saveWorkspaceSettings = useCallback(async (changes: Partial<WorkspaceSettings>) => {
    if (!workspace) throw new Error('Рабочее пространство не готово')
    const next = { ...(workspaceSettings ?? demoWorkspaceSettings), ...changes, workspace_id: workspace.id, updated_at: new Date().toISOString() }
    if (demo) {
      setWorkspaceSettings(next)
      return
    }
    if (!supabase) throw new Error('Supabase не настроен')
    const payload = {
      workspace_id: workspace.id,
      security_enabled: next.security_enabled,
      security_policy: next.security_policy,
      ai_enabled: next.ai_enabled,
      ai_policy: next.ai_policy,
      notifications_enabled: next.notifications_enabled,
      notifications_policy: next.notifications_policy,
      audit_enabled: next.audit_enabled,
      audit_policy: next.audit_policy,
    }
    const { data, error: saveError } = await supabase.from('workspace_settings').upsert(payload, { onConflict: 'workspace_id' }).select('*').single()
    if (saveError) throw saveError
    setWorkspaceSettings(data as WorkspaceSettings)
  }, [demo, workspace, workspaceSettings])

  const saveBrand = useCallback(async (brand: Brand) => {
    if (demo) {
      setBrands((items) => items.map((item) => item.id === brand.id ? { ...brand, updated_at: new Date().toISOString() } : item))
      return
    }
    if (!supabase) throw new Error('Supabase не настроен')
    const changes: Partial<Brand> = { ...brand }
    delete changes.id
    delete changes.created_at
    delete changes.updated_at
    const { data, error: updateError } = await supabase.from('brands').update(changes).eq('id', brand.id).select('*').single()
    if (updateError) throw updateError
    setBrands((items) => items.map((item) => item.id === brand.id ? data as unknown as Brand : item))
  }, [demo])

  const createBrand = useCallback(async (name: string) => {
    if (!workspace) throw new Error('Рабочее пространство не готово')
    if (demo) {
      const brand = { ...demoBrand, id: crypto.randomUUID(), workspace_id: workspace.id, name: name.trim(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      setBrands((items) => [...items, brand])
      return brand
    }
    if (!supabase) throw new Error('Supabase не настроен')
    const { data, error: insertError } = await supabase.from('brands').insert({ workspace_id: workspace.id, name: name.trim() }).select('*').single()
    if (insertError) throw insertError
    const brand = data as unknown as Brand
    setBrands((items) => [...items, brand])
    return brand
  }, [demo, workspace])

  const addManualAccount = useCallback(async (username: string, brandId: string | null = brands[0]?.id ?? null) => {
    if (!workspace) throw new Error('Рабочее пространство не готово')
    const cleanUsername = username.trim().replace(/^@/, '')
    if (!cleanUsername) throw new Error('Укажите Threads username')
    if (demo) {
      const account = { ...demoAccount, id: crypto.randomUUID(), workspace_id: workspace.id, brand_id: brandId, username: cleanUsername, display_name: cleanUsername, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      setAccounts((items) => [...items, account])
      return account
    }
    if (!supabase) throw new Error('Supabase не настроен')
    const { data, error: insertError } = await supabase.from('threads_accounts').insert({ workspace_id: workspace.id, brand_id: brandId, username: cleanUsername, display_name: cleanUsername, status: 'manual' }).select('*').single()
    if (insertError) throw insertError
    const account = data as ThreadAccount
    setAccounts((items) => [...items, account])
    return account
  }, [brands, demo, workspace])

  const updateAccount = useCallback(async (accountId: string, changes: Partial<Pick<ThreadAccount, 'brand_id' | 'display_name'>>) => {
    if (demo) {
      setAccounts((items) => items.map((item) => item.id === accountId ? { ...item, ...changes, updated_at: new Date().toISOString() } : item))
      return
    }
    if (!supabase) throw new Error('Supabase не настроен')
    const { data, error: updateError } = await supabase.from('threads_accounts').update(changes).eq('id', accountId).select('*').single()
    if (updateError) throw updateError
    setAccounts((items) => items.map((item) => item.id === accountId ? data as ThreadAccount : item))
  }, [demo])

  const deleteAccount = useCallback(async (accountId: string) => {
    if (demo) {
      setAccounts((items) => items.filter((item) => item.id !== accountId))
      return
    }
    if (!supabase) throw new Error('Supabase не настроен')
    const { error: deleteError } = await supabase.from('threads_accounts').delete().eq('id', accountId)
    if (deleteError) throw deleteError
    setAccounts((items) => items.filter((item) => item.id !== accountId))
  }, [demo])

  const createQuickDraft = useCallback(async (content: string, format: ContentFormat = 'post', source = 'manual') => {
    if (!workspace || !user) throw new Error('Рабочее пространство не готово')
    const payload = {
      workspace_id: workspace.id,
      brand_id: brands[0]?.id ?? null,
      account_id: accounts[0]?.id ?? null,
      created_by: user.id,
      format,
      title: content.trim().slice(0, 80),
      content: content.trim(),
      source,
      status: 'draft' as const,
    }
    if (demo) {
      const draft = { ...payload, id: crypto.randomUUID(), variants: [], selected_variant: null, risk_score: 0, risk_level: 'low' as const, compliance_notes: [], scheduled_at: null, published_at: null, threads_post_id: null, error_message: null, metadata: {}, created_at: now, updated_at: now }
      setDrafts((items) => [draft, ...items])
      return draft
    }
    if (!supabase) throw new Error('Supabase не настроен')
    const { data, error: insertError } = await supabase.from('drafts').insert(payload).select('*').single()
    if (insertError) throw insertError
    const draft = normalizeDraft(data)
    setDrafts((items) => [draft, ...items])
    return draft
  }, [accounts, brands, demo, user, workspace])

  const updateDraft = useCallback(async (draftId: string, changes: Partial<Pick<Draft, 'title' | 'content' | 'status' | 'risk_score' | 'risk_level' | 'scheduled_at'>>) => {
    if (demo) {
      setDrafts((items) => items.map((item) => item.id === draftId ? { ...item, ...changes, updated_at: new Date().toISOString() } : item))
      return
    }
    if (!supabase) throw new Error('Supabase не настроен')
    const { data, error: updateError } = await supabase.from('drafts').update(changes).eq('id', draftId).select('*').single()
    if (updateError) throw updateError
    setDrafts((items) => items.map((item) => item.id === draftId ? normalizeDraft(data) : item))
  }, [demo])

  const requestApproval = useCallback(async (draftId: string, reason = '') => {
    if (!workspace || !user) throw new Error('Рабочее пространство не готово')
    if (demo) {
      const approval: Approval = { id: crypto.randomUUID(), workspace_id: workspace.id, draft_id: draftId, requested_by: user.id, status: 'pending', reason, decision_note: '', reviewed_by: null, reviewed_at: null, created_at: now, updated_at: now }
      setApprovals((items) => [approval, ...items.filter((item) => item.draft_id !== draftId)])
      setDrafts((items) => items.map((item) => item.id === draftId ? { ...item, status: 'pending_approval' } : item))
      return
    }
    if (!supabase) throw new Error('Supabase не настроен')
    const { error: approvalError } = await supabase.rpc('request_draft_approval', { p_draft_id: draftId, p_reason: reason })
    if (approvalError) throw approvalError
    await refresh()
  }, [demo, refresh, user, workspace])

  const reviewApproval = useCallback(async (approvalId: string, status: ApprovalStatus, note = '') => {
    const approval = approvals.find((item) => item.id === approvalId)
    if (!approval || !user) throw new Error('Согласование не найдено')
    const draftStatus = status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'draft'
    if (demo) {
      setApprovals((items) => items.map((item) => item.id === approvalId ? { ...item, status, decision_note: note, reviewed_by: user.id, reviewed_at: new Date().toISOString() } : item))
      setDrafts((items) => items.map((item) => item.id === approval.draft_id ? { ...item, status: draftStatus } : item))
      return
    }
    if (!supabase) throw new Error('Supabase не настроен')
    const { error: approvalError } = await supabase.rpc('review_draft_approval', { p_approval_id: approvalId, p_status: status, p_note: note })
    if (approvalError) throw approvalError
    await refresh()
  }, [approvals, demo, refresh, user])

  const uploadMedia = useCallback(async (file: File, title = file.name, brandId: string | null = brands[0]?.id ?? null) => {
    if (!workspace || !user) throw new Error('Рабочее пространство не готово')
    if (!file.type.startsWith('image/')) throw new Error('Можно загружать только изображения')
    if (file.size > 10 * 1024 * 1024) throw new Error('Максимальный размер файла — 10 МБ')
    if (demo) throw new Error('Загрузка файлов доступна после подключения Supabase Storage')
    if (!supabase) throw new Error('Supabase не настроен')
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-')
    const path = `${workspace.id}/${user.id}/${crypto.randomUUID()}-${safeName}`
    const { error: storageError } = await supabase.storage.from('media-assets').upload(path, file, { contentType: file.type, upsert: false })
    if (storageError) throw storageError
    const { data, error: insertError } = await supabase.from('media_assets').insert({ workspace_id: workspace.id, brand_id: brandId, created_by: user.id, title: title.trim() || file.name, storage_path: path, mime_type: file.type, size_bytes: file.size, source: 'upload' }).select('*').single()
    if (insertError) {
      await supabase.storage.from('media-assets').remove([path])
      throw insertError
    }
    const signed = await supabase.storage.from('media-assets').createSignedUrl(path, 60 * 60)
    const asset = { ...data, url: signed.data?.signedUrl ?? '' } as MediaAsset
    setMediaAssets((items) => [asset, ...items])
    return asset
  }, [brands, demo, user, workspace])

  const deleteMedia = useCallback(async (asset: MediaAsset) => {
    if (demo) throw new Error('Удаление файлов доступно после подключения Supabase Storage')
    if (!supabase) throw new Error('Supabase не настроен')
    const { error: storageError } = await supabase.storage.from('media-assets').remove([asset.storage_path])
    if (storageError) throw storageError
    const { error: deleteError } = await supabase.from('media_assets').delete().eq('id', asset.id)
    if (deleteError) throw deleteError
    setMediaAssets((items) => items.filter((item) => item.id !== asset.id))
  }, [demo])

  const deleteMonitorSource = useCallback(async (sourceId: string) => {
    if (demo) throw new Error('В демо нет сохранённых RSS-источников')
    if (!supabase) throw new Error('Supabase не настроен')
    const { error: itemError } = await supabase.from('monitor_items').delete().eq('source_id', sourceId)
    if (itemError) throw itemError
    const { error: sourceError } = await supabase.from('monitor_sources').delete().eq('id', sourceId)
    if (sourceError) throw sourceError
    setMonitorSources((items) => items.filter((item) => item.id !== sourceId))
    setMonitorItems((items) => items.filter((item) => item.source_id !== sourceId))
  }, [demo])

  const [teamMembers, setTeamMembers] = useState<{ id: string; email: string; name: string; role: WorkspaceRole }[]>([])

  const loadTeamMembers = useCallback(async () => {
    if (!workspace) return
    if (demo) {
      setTeamMembers([
        { id: '1', email: 'owner@technova.demo', name: 'Алексей', role: 'owner' as WorkspaceRole },
        { id: '2', email: 'editor@technova.demo', name: 'Мария', role: 'editor' as WorkspaceRole },
        { id: '3', email: 'viewer@technova.demo', name: 'Дмитрий', role: 'viewer' as WorkspaceRole },
      ])
      return
    }
    const sb = supabase
    if (!sb) return
    const { data } = await sb.from('workspace_members').select('id, user_id, role').eq('workspace_id', workspace.id)
    if (!data) return
    const membersWithProfiles = await Promise.all(data.map(async (m) => {
      const { data: profile } = await sb.from('profiles').select('email, display_name').eq('id', m.user_id).single()
      return { id: m.id as string, email: (profile?.email as string) ?? '', name: (profile?.display_name as string) ?? '', role: m.role as WorkspaceRole }
    }))
    setTeamMembers(membersWithProfiles)
  }, [demo, workspace])

  useEffect(() => { void loadTeamMembers() }, [loadTeamMembers])

  const inviteTeamMember = useCallback(async (email: string, role: string) => {
    if (!workspace) throw new Error('Рабочее пространство не готово')
    if (demo) {
      setTeamMembers((items) => [...items, { id: crypto.randomUUID(), email, name: email.split('@')[0], role: role as WorkspaceRole }])
      return
    }
    if (!supabase) throw new Error('Supabase не настроен')
    const { data: users } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle()
    if (!users) throw new Error('Пользователь не найден')
    const { error } = await supabase.from('workspace_members').insert({
      workspace_id: workspace.id,
      user_id: (users as { id: string }).id,
      role: role as WorkspaceRole,
      invited_by: user!.id,
    })
    if (error) throw error
    await loadTeamMembers()
  }, [demo, workspace, user, loadTeamMembers])

  const updateTeamMemberRole = useCallback(async (memberId: string, role: string) => {
    if (demo) {
      setTeamMembers((items) => items.map((m) => m.id === memberId ? { ...m, role: role as WorkspaceRole } : m))
      return
    }
    if (!supabase) throw new Error('Supabase не настроен')
    const { error } = await supabase.from('workspace_members').update({ role: role as WorkspaceRole }).eq('id', memberId)
    if (error) throw error
    await loadTeamMembers()
  }, [demo, loadTeamMembers])

  const removeTeamMember = useCallback(async (memberId: string) => {
    if (demo) {
      setTeamMembers((items) => items.filter((m) => m.id !== memberId))
      return
    }
    if (!supabase) throw new Error('Supabase не настроен')
    const { error } = await supabase.from('workspace_members').delete().eq('id', memberId)
    if (error) throw error
    await loadTeamMembers()
  }, [demo, loadTeamMembers])

  const deleteBrand = useCallback(async (brandId: string) => {
    if (demo) {
      setBrands((items) => items.filter((b) => b.id !== brandId))
      return
    }
    if (!supabase) throw new Error('Supabase не настроен')
    const { error } = await supabase.from('brands').delete().eq('id', brandId)
    if (error) throw error
    setBrands((items) => items.filter((b) => b.id !== brandId))
  }, [demo])

  const deleteDraft = useCallback(async (draftId: string) => {
    if (demo) {
      setDrafts((items) => items.filter((d) => d.id !== draftId))
      return
    }
    if (!supabase) throw new Error('Supabase не настроен')
    const { error } = await supabase.from('drafts').delete().eq('id', draftId)
    if (error) throw error
    setDrafts((items) => items.filter((d) => d.id !== draftId))
  }, [demo])

  const dismissMonitorItem = useCallback(async (itemId: string) => {
    if (demo) {
      setMonitorItems((items) => items.filter((item) => item.id !== itemId))
      return
    }
    if (!supabase) throw new Error('Supabase не настроен')
    const { error: dismissError } = await supabase.from('monitor_items').update({ dismissed: true }).eq('id', itemId)
    if (dismissError) throw dismissError
    setMonitorItems((items) => items.filter((item) => item.id !== itemId))
  }, [demo])

  const value = useMemo<WorkspaceContextValue>(() => ({
    workspace, brands, accounts, drafts, approvals, mediaAssets, monitorSources, monitorItems, workspaceSettings, auditLogs, loading, error, refresh,
    createWorkspace, updateWorkspace, saveWorkspaceSettings, createBrand, saveBrand, addManualAccount, updateAccount, deleteAccount, createQuickDraft, updateDraft, requestApproval, reviewApproval, uploadMedia, deleteMedia, deleteMonitorSource, dismissMonitorItem,
    deleteBrand, deleteDraft,
    teamMembers, inviteTeamMember, updateTeamMemberRole, removeTeamMember,
  }), [accounts, addManualAccount, approvals, auditLogs, brands, createBrand, createQuickDraft, createWorkspace, deleteAccount, deleteBrand, deleteDraft, deleteMedia, deleteMonitorSource, dismissMonitorItem, drafts, error, inviteTeamMember, loading, mediaAssets, monitorItems, monitorSources, refresh, removeTeamMember, requestApproval, reviewApproval, saveBrand, saveWorkspaceSettings, teamMembers, updateAccount, updateDraft, updateTeamMemberRole, updateWorkspace, uploadMedia, workspace, workspaceSettings])

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (!context) throw new Error('useWorkspace must be used inside WorkspaceProvider')
  return context
}
