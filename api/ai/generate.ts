import { GoogleGenAI } from '@google/genai'
import type { ApiRequest, ApiResponse } from '../_lib/http.js'
import { enforceRateLimit, RateLimitError, requireUser } from '../_lib/supabaseServer.js'

interface GenerateBody {
  workspaceId: string
  prompt: string
  format: 'post' | 'thread' | 'reply'
  riskTolerance: number
  modelId: string
}

interface GeneratedVariant {
  id: 'A' | 'B' | 'C'
  tone: string
  text: string
  hookScore: number
  complianceScore: number
  complianceNote: string
}

const VALID_MODELS = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.5-pro']
const MODEL_TOKEN_COST: Record<string, number> = {
  'gemini-2.0-flash': 1,
  'gemini-2.5-flash': 2,
  'gemini-2.5-pro': 5,
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
    && VALID_MODELS.includes(body.modelId ?? '')
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  response.setHeader('Cache-Control', 'no-store')
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Метод не поддерживается' })
    return
  }
  if (!isGenerateBody(request.body)) {
    response.status(400).json({ error: 'Проверьте параметры генерации' })
    return
  }

  let reservedAmount = 0
  let adminRef: unknown = null
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      response.status(503).json({ error: 'Gemini API ещё не настроен' })
      return
    }

    const { user, admin } = await requireUser(request)
    adminRef = admin
    const { data: membership } = await admin
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', request.body.workspaceId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!membership) {
      response.status(403).json({ error: 'Нет доступа к рабочему пространству' })
      return
    }
    await enforceRateLimit(admin, 'ai.generate', user.id, 10, 60)

    const modelId = request.body.modelId
    const tokenCost = MODEL_TOKEN_COST[modelId] ?? 1

    const { data: workspace } = await admin
      .from('workspaces').select('id, name').eq('id', request.body.workspaceId).single()
    if (!workspace) {
      response.status(404).json({ error: 'Рабочее пространство не найдено' })
      return
    }

    const tokenResult = await rpc(admin, 'reserve_tokens', { p_workspace_id: workspace.id, p_amount: tokenCost })
    const tokenData = tokenResult.data as { ok: boolean; error?: string; balance?: number } | undefined
    if (!tokenData?.ok) {
      if (tokenData?.error === 'TOKENS_EXHAUSTED') {
        response.status(402).json({ error: `Недостаточно токенов. Баланс: ${tokenData.balance ?? 0}, требуется: ${tokenCost}`, code: 'TOKENS_EXHAUSTED', balance: tokenData.balance ?? 0, required: tokenCost })
        return
      }
      throw new Error('TOKEN_RESERVE_FAILED')
    }
    reservedAmount = tokenCost

    const brand = request.body.riskTolerance > 0
      ? (await admin.from('brands').select('*').eq('workspace_id', request.body.workspaceId).order('created_at').limit(1).maybeSingle()).data
      : null

    const ai = new GoogleGenAI({ apiKey })
    const generation = await ai.models.generateContent({
      model: modelId,
      contents: `Создай три варианта для Threads. Формат: ${request.body.format}. Основная мысль: ${request.body.prompt.trim()}`,
      config: {
        systemInstruction: [
          'Ты редактор русскоязычного Threads-контента.',
          'Не придумывай цифры, факты, клиентов и результаты. Если данных нет, формулируй без неподтверждённых утверждений.',
          'Каждый вариант должен быть самостоятельным, естественным, без канцелярита и не длиннее 500 символов.',
          `Допустимый риск формулировок: ${request.body.riskTolerance} из 100.`,
          `Бренд: ${brand?.name || 'не указан'}. Ниша: ${brand?.niche || 'не указана'}. Продукт: ${brand?.product || 'не указан'}.`,
          `Аудитория: ${brand?.audience || 'не указана'}. ICP: ${brand?.icp || 'не указан'}. Гео: ${brand?.geography || 'не указано'}.`,
          `Тон: ${brand?.tone_of_voice || 'ясный и профессиональный'}. Стиль ответов: ${brand?.reply_style || 'нейтральный'}.`,
          `Контент-столпы: ${(brand?.content_pillars ?? []).join(', ') || 'не указаны'}.`,
          `CTA: ${(brand?.ctas ?? []).join(', ') || 'не указаны'}.`,
          `Позиционирование: ${brand?.positioning || 'не указано'}. УТП: ${brand?.usp || 'не указано'}.`,
          `Запрещённые темы: ${(brand?.forbidden_topics ?? []).join(', ') || 'нет'}.`,
        ].join('\n'),
        responseMimeType: 'application/json',
        responseJsonSchema: {
          type: 'object',
          properties: {
            variants: {
              type: 'array',
              minItems: 3,
              maxItems: 3,
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', enum: ['A', 'B', 'C'] },
                  tone: { type: 'string' },
                  text: { type: 'string' },
                  hookScore: { type: 'number', minimum: 0, maximum: 10 },
                  complianceScore: { type: 'number', minimum: 0, maximum: 100 },
                  complianceNote: { type: 'string' },
                },
                required: ['id', 'tone', 'text', 'hookScore', 'complianceScore', 'complianceNote'],
              },
            },
          },
          required: ['variants'],
        },
      },
    })

    const parsed = JSON.parse(generation.text || '{"variants":[]}') as { variants?: GeneratedVariant[] }
    if (!parsed.variants || parsed.variants.length !== 3 || parsed.variants.some((item) => !item || typeof item.text !== 'string' || typeof item.tone !== 'string')) throw new Error('INVALID_MODEL_RESPONSE')
    const variants = parsed.variants.map((item, index) => ({
      id: (['A', 'B', 'C'] as const)[index],
      tone: item.tone.slice(0, 80),
      text: item.text.trim().slice(0, 500),
      hookScore: Math.max(0, Math.min(10, Number(item.hookScore) || 0)),
      complianceScore: Math.max(0, Math.min(100, Number(item.complianceScore) || 0)),
      complianceNote: String(item.complianceNote || 'Проверено').slice(0, 180),
    }))

    await Promise.all([
      rpc(admin, 'log_token_spend', { p_workspace_id: workspace.id, p_user_id: user.id, p_amount: tokenCost, p_model_id: modelId, p_description: `${request.body.format} generation` }),
      admin.from('usage_events').insert({
        workspace_id: workspace.id,
        user_id: user.id,
        provider: 'gemini',
        model: modelId,
        operation: 'content_generation',
        input_tokens: generation.usageMetadata?.promptTokenCount ?? 0,
        output_tokens: generation.usageMetadata?.candidatesTokenCount ?? 0,
        credits: tokenCost,
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
    if (error instanceof RateLimitError) {
      response.setHeader('Retry-After', String(error.retryAfter))
      response.status(429).json({ error: `Слишком много запросов. Повторите через ${error.retryAfter} сек.` })
    } else if (code === 'UNAUTHORIZED') response.status(401).json({ error: 'Войдите в аккаунт заново' })
    else if (code === 'SUPABASE_SERVER_NOT_CONFIGURED') response.status(503).json({ error: 'Серверная часть Supabase не настроена' })
    else if (code === 'TOKENS_EXHAUSTED') response.status(402).json({ error: 'Лимит AI-токенов исчерпан' })
    else response.status(502).json({ error: code === 'INVALID_MODEL_RESPONSE' ? 'AI вернул некорректный ответ. Повторите генерацию.' : 'AI-генерация временно недоступна' })
  }
}
