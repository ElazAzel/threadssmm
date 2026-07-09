import type { ApiRequest, ApiResponse } from '../_lib/http.js'
import { enforceRateLimit, RateLimitError, requireUser } from '../_lib/supabaseServer.js'
import { callGoogle } from './providers/google.js'
import { callOpenAI } from './providers/openai.js'
import { callGrok } from './providers/grok.js'
import { callAnthropic } from './providers/anthropic.js'
import { callDeepSeek } from './providers/deepseek.js'

interface GenerateBody {
  workspaceId: string
  prompt: string
  format: 'post' | 'thread' | 'reply'
  riskTolerance: number
  modelId: string
}

const VALID_MODEL_IDS = [
  'gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash',
  'gpt-4o', 'gpt-4o-mini',
  'grok-3', 'grok-3-mini',
  'claude-sonnet-4', 'claude-haiku-3',
  'deepseek-v3', 'deepseek-r1',
]

const MODEL_TOKEN_COST: Record<string, number> = {
  'gemini-2.5-pro': 5, 'gemini-2.5-flash': 2, 'gemini-2.0-flash': 1,
  'gpt-4o': 5, 'gpt-4o-mini': 2,
  'grok-3': 4, 'grok-3-mini': 2,
  'claude-sonnet-4': 5, 'claude-haiku-3': 2,
  'deepseek-v3': 2, 'deepseek-r1': 3,
}

function rpc(admin: unknown, name: string, params: Record<string, unknown>) {
  return (admin as { rpc: (n: string, p: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }> }).rpc(name, params)
}

function isGenerateBody(value: unknown): value is GenerateBody {
  if (!value || typeof value !== 'object') return false
  const body = value as Partial<GenerateBody>
  return typeof body.workspaceId === 'string'
    && typeof body.prompt === 'string'
    && body.prompt.trim().length >= 5
    && ['post', 'thread', 'reply'].includes(body.format ?? '')
    && typeof body.riskTolerance === 'number'
    && body.riskTolerance >= 0
    && body.riskTolerance <= 100
    && VALID_MODEL_IDS.includes(body.modelId ?? '')
}

const PROVIDER_ROUTER: Record<string, (modelId: string, prompt: string, format: string, riskTolerance: number, brand: Record<string, unknown> | null) => Promise<Array<{ id: string; tone: string; text: string; hookScore: number; complianceScore: number; complianceNote: string }>>> = {
  'gemini-2.5-pro': callGoogle, 'gemini-2.5-flash': callGoogle, 'gemini-2.0-flash': callGoogle,
  'gpt-4o': callOpenAI, 'gpt-4o-mini': callOpenAI,
  'grok-3': callGrok, 'grok-3-mini': callGrok,
  'claude-sonnet-4': callAnthropic, 'claude-haiku-3': callAnthropic,
  'deepseek-v3': callDeepSeek, 'deepseek-r1': callDeepSeek,
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  response.setHeader('Cache-Control', 'no-store')
  if (request.method !== 'POST') return response.status(405).json({ error: 'Метод не поддерживается' })
  if (!isGenerateBody(request.body)) return response.status(400).json({ error: 'Проверьте параметры генерации' })

  let reservedAmount = 0
  let adminRef: unknown = null
  try {
    const { user, admin } = await requireUser(request)
    adminRef = admin
    const { data: membership } = await admin.from('workspace_members').select('role').eq('workspace_id', request.body.workspaceId).eq('user_id', user.id).maybeSingle()
    if (!membership) return response.status(403).json({ error: 'Нет доступа к рабочему пространству' })
    await enforceRateLimit(admin, 'ai.generate', user.id, 10, 60)

    const modelId = request.body.modelId
    const tokenCost = MODEL_TOKEN_COST[modelId] ?? 1

    const { data: workspace } = await admin.from('workspaces').select('id, name').eq('id', request.body.workspaceId).single()
    if (!workspace) return response.status(404).json({ error: 'Рабочее пространство не найдено' })

    const tokenResult = await rpc(admin, 'reserve_tokens', { p_workspace_id: workspace.id, p_amount: tokenCost })
    const tokenData = tokenResult.data as { ok: boolean; error?: string; balance?: number } | undefined
    if (!tokenData?.ok) {
      if (tokenData?.error === 'TOKENS_EXHAUSTED') return response.status(402).json({ error: `Недостаточно токенов. Баланс: ${tokenData.balance ?? 0}, требуется: ${tokenCost}`, code: 'TOKENS_EXHAUSTED', balance: tokenData.balance ?? 0, required: tokenCost })
      throw new Error('TOKEN_RESERVE_FAILED')
    }
    reservedAmount = tokenCost

    const brand = request.body.riskTolerance > 0
      ? (await admin.from('brands').select('*').eq('workspace_id', request.body.workspaceId).order('created_at').limit(1).maybeSingle()).data as Record<string, unknown> | null
      : null

    const providerFn = PROVIDER_ROUTER[modelId]
    if (!providerFn) throw new Error('UNKNOWN_MODEL')

    const variants = await providerFn(modelId, request.body.prompt, request.body.format, request.body.riskTolerance, brand)

    await Promise.all([
      rpc(admin, 'log_token_spend', { p_workspace_id: workspace.id, p_user_id: user.id, p_amount: tokenCost, p_model_id: modelId, p_description: `${request.body.format} generation` }),
      admin.from('usage_events').insert({
        workspace_id: workspace.id, user_id: user.id, provider: modelId.split('-')[0], model: modelId,
        operation: 'content_generation',
        input_tokens: 0, output_tokens: 0, credits: tokenCost,
        metadata: { format: request.body.format },
      }).then(() => {}),
    ])

    reservedAmount = 0
    response.status(200).json({ variants, modelId, tokenCost })
  } catch (error) {
    if (reservedAmount > 0 && adminRef) {
      await rpc(adminRef, 'refund_tokens', { p_workspace_id: request.body.workspaceId, p_amount: reservedAmount })
    }
    const code = error instanceof Error ? error.message : ''
    if (error instanceof RateLimitError) return response.status(429).json({ error: `Слишком много запросов. Повторите через ${error.retryAfter} сек.` })
    if (code === 'UNAUTHORIZED') return response.status(401).json({ error: 'Войдите в аккаунт заново' })
    if (code === 'TOKENS_EXHAUSTED') return response.status(402).json({ error: 'Лимит AI-токенов исчерпан' })
    response.status(502).json({ error: code === 'INVALID_MODEL_RESPONSE' ? 'AI вернул некорректный ответ. Повторите генерацию.' : 'AI-генерация временно недоступна' })
  }
}
