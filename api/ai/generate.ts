import { GoogleGenAI } from '@google/genai'
import type { ApiRequest, ApiResponse } from '../_lib/http.js'
import { requireUser } from '../_lib/supabaseServer.js'

interface GenerateBody {
  workspaceId: string
  prompt: string
  format: 'post' | 'thread' | 'reply'
  riskTolerance: number
}

interface GeneratedVariant {
  id: 'A' | 'B' | 'C'
  tone: string
  text: string
  hookScore: number
  complianceScore: number
  complianceNote: string
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

  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      response.status(503).json({ error: 'Gemini API ещё не настроен' })
      return
    }

    const { user, admin } = await requireUser(request)
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

    const [{ data: workspace }, { data: brand }] = await Promise.all([
      admin.from('workspaces').select('id, name, ai_credits').eq('id', request.body.workspaceId).single(),
      admin.from('brands').select('*').eq('workspace_id', request.body.workspaceId).order('created_at').limit(1).maybeSingle(),
    ])
    if (!workspace) {
      response.status(404).json({ error: 'Рабочее пространство не найдено' })
      return
    }
    if (workspace.ai_credits < 1) {
      response.status(402).json({ error: 'Лимит AI-кредитов исчерпан' })
      return
    }

    const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash'
    const ai = new GoogleGenAI({ apiKey })
    const generation = await ai.models.generateContent({
      model,
      contents: `Создай три варианта для Threads. Формат: ${request.body.format}. Основная мысль: ${request.body.prompt.trim()}`,
      config: {
        systemInstruction: [
          'Ты редактор русскоязычного Threads-контента.',
          'Не придумывай цифры, факты, клиентов и результаты. Если данных нет, формулируй без неподтверждённых утверждений.',
          'Каждый вариант должен быть самостоятельным, естественным, без канцелярита и не длиннее 500 символов.',
          `Допустимый риск формулировок: ${request.body.riskTolerance} из 100.`,
          `Бренд: ${brand?.name || 'не указан'}. Ниша: ${brand?.niche || 'не указана'}.`,
          `Аудитория: ${brand?.audience || 'не указана'}. Тон: ${brand?.tone_of_voice || 'ясный и профессиональный'}.`,
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
      admin.from('workspaces').update({ ai_credits: workspace.ai_credits - 1 }).eq('id', workspace.id),
      admin.from('usage_events').insert({
        workspace_id: workspace.id,
        user_id: user.id,
        provider: 'gemini',
        model,
        operation: 'content_generation',
        input_tokens: generation.usageMetadata?.promptTokenCount ?? 0,
        output_tokens: generation.usageMetadata?.candidatesTokenCount ?? 0,
        credits: 1,
        metadata: { format: request.body.format },
      }),
    ])

    response.status(200).json({ variants, creditsRemaining: workspace.ai_credits - 1 })
  } catch (error) {
    const code = error instanceof Error ? error.message : ''
    if (code === 'UNAUTHORIZED') response.status(401).json({ error: 'Войдите в аккаунт заново' })
    else if (code === 'SUPABASE_SERVER_NOT_CONFIGURED') response.status(503).json({ error: 'Серверная часть Supabase не настроена' })
    else response.status(500).json({ error: 'AI-генерация временно недоступна' })
  }
}
