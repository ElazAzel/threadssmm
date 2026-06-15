/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Approval, ApprovalStatus, Brand, ContentFormat, Draft, MediaAsset, MonitorItem, MonitorSource, OnboardingInput, ThreadAccount, Workspace } from '../lib/domain'
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
  loading: boolean
  error: string
  refresh: () => Promise<void>
  createWorkspace: (input: OnboardingInput) => Promise<void>
  updateWorkspace: (changes: Partial<Pick<Workspace, 'name' | 'region' | 'timezone'>>) => Promise<void>
  createBrand: (name: string) => Promise<Brand>
  saveBrand: (brand: Brand) => Promise<void>
  addManualAccount: (username: string, brandId?: string | null) => Promise<ThreadAccount>
  createQuickDraft: (content: string, format?: ContentFormat) => Promise<Draft>
  updateDraft: (draftId: string, changes: Partial<Pick<Draft, 'title' | 'content' | 'status' | 'risk_score' | 'risk_level' | 'scheduled_at'>>) => Promise<void>
  requestApproval: (draftId: string, reason?: string) => Promise<void>
  reviewApproval: (approvalId: string, status: ApprovalStatus, note?: string) => Promise<void>
  uploadMedia: (file: File, title?: string) => Promise<MediaAsset>
  deleteMedia: (asset: MediaAsset) => Promise<void>
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

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

function slugify(value: string) {
  const base = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'workspace'
  return `${base}-${crypto.randomUUID().slice(0, 8)}`
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
      setLoading(false)
      return
    }

    const client = supabase
    setLoading(true)
    setError('')
    const membershipResult = await supabase
      .from('workspace_members')
      .select('workspace_id, workspaces(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (membershipResult.error) {
      setError(membershipResult.error.message)
      setLoading(false)
      return
    }

    const nextWorkspace = membershipResult.data?.workspaces as unknown as Workspace | null
    setWorkspace(nextWorkspace)
    if (!nextWorkspace) {
      setBrands([])
      setAccounts([])
      setDrafts([])
      setApprovals([])
      setMediaAssets([])
      setMonitorSources([])
      setMonitorItems([])
      setLoading(false)
      return
    }

    const [brandResult, accountResult, draftResult, approvalResult, mediaResult, sourceResult, itemResult] = await Promise.all([
      supabase.from('brands').select('*').eq('workspace_id', nextWorkspace.id).order('created_at'),
      supabase.from('threads_accounts').select('*').eq('workspace_id', nextWorkspace.id).order('created_at'),
      supabase.from('drafts').select('*').eq('workspace_id', nextWorkspace.id).order('created_at', { ascending: false }),
      supabase.from('approvals').select('*').eq('workspace_id', nextWorkspace.id).order('created_at', { ascending: false }),
      supabase.from('media_assets').select('*').eq('workspace_id', nextWorkspace.id).order('created_at', { ascending: false }),
      supabase.from('monitor_sources').select('*').eq('workspace_id', nextWorkspace.id).order('created_at', { ascending: false }),
      supabase.from('monitor_items').select('*').eq('workspace_id', nextWorkspace.id).eq('dismissed', false).order('published_at', { ascending: false }).limit(100),
    ])

    const firstError = brandResult.error ?? accountResult.error ?? draftResult.error ?? approvalResult.error ?? mediaResult.error ?? sourceResult.error ?? itemResult.error
    if (firstError) setError(firstError.message)
    setBrands((brandResult.data ?? []) as Brand[])
    setAccounts((accountResult.data ?? []) as ThreadAccount[])
    setDrafts((draftResult.data ?? []) as Draft[])
    setApprovals((approvalResult.data ?? []) as Approval[])
    const mediaRows = mediaResult.data ?? []
    const mediaWithUrls = await Promise.all(mediaRows.map(async (row) => {
      const signed = await client.storage.from('media-assets').createSignedUrl(row.storage_path, 60 * 60)
      return { ...row, url: signed.data?.signedUrl ?? '' } as MediaAsset
    }))
    setMediaAssets(mediaWithUrls)
    setMonitorSources((sourceResult.data ?? []) as MonitorSource[])
    setMonitorItems((itemResult.data ?? []) as MonitorItem[])
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

    const { data: createdWorkspace, error: workspaceError } = await supabase
      .from('workspaces')
      .insert({
        owner_id: user.id,
        name: input.workspaceName.trim(),
        slug: slugify(input.workspaceName),
        region: input.region,
        locale: input.locale,
        timezone: input.timezone,
        onboarding_completed: true,
      })
      .select('*')
      .single()
    if (workspaceError) throw workspaceError

    const { error: memberError } = await supabase.from('workspace_members').insert({
      workspace_id: createdWorkspace.id,
      user_id: user.id,
      role: 'owner',
    })
    if (memberError) throw memberError

    const { error: brandError } = await supabase.from('brands').insert({
      workspace_id: createdWorkspace.id,
      name: input.brandName.trim(),
      niche: input.niche.trim(),
      audience: input.audience.trim(),
      goals: [input.goal],
      language: input.locale,
      geography: input.region,
    })
    if (brandError) throw brandError

    const { error: aiError } = await supabase.from('ai_settings').insert({ workspace_id: createdWorkspace.id })
    if (aiError) throw aiError

    if (input.manualThreadsHandle?.trim()) {
      const { error: accountError } = await supabase.from('threads_accounts').insert({
        workspace_id: createdWorkspace.id,
        username: input.manualThreadsHandle.trim().replace(/^@/, ''),
        display_name: input.brandName.trim(),
        status: 'manual',
      })
      if (accountError) throw accountError
    }
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
    setBrands((items) => items.map((item) => item.id === brand.id ? data as Brand : item))
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
    const brand = data as Brand
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

  const createQuickDraft = useCallback(async (content: string, format: ContentFormat = 'post') => {
    if (!workspace || !user) throw new Error('Рабочее пространство не готово')
    const payload = {
      workspace_id: workspace.id,
      brand_id: brands[0]?.id ?? null,
      account_id: accounts[0]?.id ?? null,
      created_by: user.id,
      format,
      title: content.trim().slice(0, 80),
      content: content.trim(),
      source: 'manual',
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
    const draft = data as Draft
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
    setDrafts((items) => items.map((item) => item.id === draftId ? data as Draft : item))
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
    const { error: draftError } = await supabase.from('drafts').update({ status: 'pending_approval' }).eq('id', draftId)
    if (draftError) throw draftError
    const { error: approvalError } = await supabase.from('approvals').upsert({ workspace_id: workspace.id, draft_id: draftId, requested_by: user.id, status: 'pending', reason }, { onConflict: 'draft_id' })
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
    const { error: approvalError } = await supabase.from('approvals').update({ status, decision_note: note, reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq('id', approvalId)
    if (approvalError) throw approvalError
    const { error: draftError } = await supabase.from('drafts').update({ status: draftStatus }).eq('id', approval.draft_id)
    if (draftError) throw draftError
    await refresh()
  }, [approvals, demo, refresh, user])

  const uploadMedia = useCallback(async (file: File, title = file.name) => {
    if (!workspace || !user) throw new Error('Рабочее пространство не готово')
    if (!file.type.startsWith('image/')) throw new Error('Можно загружать только изображения')
    if (file.size > 10 * 1024 * 1024) throw new Error('Максимальный размер файла — 10 МБ')
    if (demo) throw new Error('Загрузка файлов доступна после подключения Supabase Storage')
    if (!supabase) throw new Error('Supabase не настроен')
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-')
    const path = `${workspace.id}/${user.id}/${crypto.randomUUID()}-${safeName}`
    const { error: storageError } = await supabase.storage.from('media-assets').upload(path, file, { contentType: file.type, upsert: false })
    if (storageError) throw storageError
    const { data, error: insertError } = await supabase.from('media_assets').insert({ workspace_id: workspace.id, brand_id: brands[0]?.id ?? null, created_by: user.id, title: title.trim() || file.name, storage_path: path, mime_type: file.type, size_bytes: file.size, source: 'upload' }).select('*').single()
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

  const value = useMemo<WorkspaceContextValue>(() => ({
    workspace, brands, accounts, drafts, approvals, mediaAssets, monitorSources, monitorItems, loading, error, refresh,
    createWorkspace, updateWorkspace, createBrand, saveBrand, addManualAccount, createQuickDraft, updateDraft, requestApproval, reviewApproval, uploadMedia, deleteMedia,
  }), [accounts, addManualAccount, approvals, brands, createBrand, createQuickDraft, createWorkspace, deleteMedia, drafts, error, loading, mediaAssets, monitorItems, monitorSources, refresh, requestApproval, reviewApproval, saveBrand, updateDraft, updateWorkspace, uploadMedia, workspace])

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (!context) throw new Error('useWorkspace must be used inside WorkspaceProvider')
  return context
}
