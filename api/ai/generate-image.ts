import type { ApiRequest, ApiResponse } from '../_lib/http.js'
import { enforceRateLimit, RateLimitError, requireUser } from '../_lib/supabaseServer.js'

interface ImageBody {
  workspaceId: string
  prompt: string
  modelId: 'imagen-3' | 'dall-e-3'
  count?: number
}

const MODEL_TOKEN_COST: Record<string, number> = { 'imagen-3': 10, 'dall-e-3': 12 }
const VALID_MODELS = ['imagen-3', 'dall-e-3']

function rpc(admin: unknown, name: string, params: Record<string, unknown>) {
  return (admin as { rpc: (n: string, p: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }> }).rpc(name, params)
}

function isImageBody(value: unknown): value is ImageBody {
  if (!value || typeof value !== 'object') return false
  const body = value as Partial<ImageBody>
  return typeof body.workspaceId === 'string'
    && typeof body.prompt === 'string'
    && body.prompt.trim().length >= 3
    && VALID_MODELS.includes(body.modelId ?? '')
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  response.setHeader('Cache-Control', 'no-store')
  if (request.method !== 'POST') return response.status(405).json({ error: 'Метод не поддерживается' })
  if (!isImageBody(request.body)) return response.status(400).json({ error: 'Проверьте параметры' })

  let reservedAmount = 0
  let adminRef: unknown = null
  try {
    const { user, admin } = await requireUser(request)
    adminRef = admin
    const { data: membership } = await admin.from('workspace_members').select('role').eq('workspace_id', request.body.workspaceId).eq('user_id', user.id).maybeSingle()
    if (!membership) return response.status(403).json({ error: 'Нет доступа' })
    await enforceRateLimit(admin, 'ai.generate-image', user.id, 5, 60)

    const modelId = request.body.modelId
    const imageCount = Math.min(request.body.count ?? 1, 4)
    const totalCost = (MODEL_TOKEN_COST[modelId] ?? 10) * imageCount

    const { data: workspace } = await admin.from('workspaces').select('id').eq('id', request.body.workspaceId).single()
    if (!workspace) return response.status(404).json({ error: 'Не найдено' })

    const tokenResult = await rpc(admin, 'reserve_tokens', { p_workspace_id: workspace.id, p_amount: totalCost })
    const tokenData = tokenResult.data as { ok: boolean; error?: string; balance?: number } | undefined
    if (!tokenData?.ok) return response.status(402).json({ error: `Недостаточно токенов`, balance: tokenData?.balance ?? 0, required: totalCost })
    reservedAmount = totalCost

    let images: string[] = []

    if (modelId === 'imagen-3') {
      const apiKey = process.env.GEMINI_API_KEY
      if (!apiKey) throw new Error('GEMINI_API_KEY_NOT_CONFIGURED')
      const { GoogleGenAI } = await import('@google/genai')
      const ai = new GoogleGenAI({ apiKey })
      const result = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp-image-generation',
        contents: request.body.prompt,
        config: { responseModalities: ['Text', 'Image'] },
      })
      if (result.candidates?.[0]?.content?.parts) {
        for (const part of result.candidates[0].content.parts) {
          if (part.inlineData?.mimeType?.startsWith('image/') && part.inlineData.data) {
            images.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`)
          }
        }
      }
    } else if (modelId === 'dall-e-3') {
      const apiKey = process.env.OPENAI_API_KEY
      if (!apiKey) throw new Error('OPENAI_API_KEY_NOT_CONFIGURED')
      const res = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: 'dall-e-3', prompt: request.body.prompt, n: imageCount, size: '1024x1024', response_format: 'b64_json' }),
      })
      if (!res.ok) throw new Error(`DALLE_ERROR: ${res.status}`)
      const data = await res.json() as { data: Array<{ b64_json: string }> }
      images = data.data.map((d) => `data:image/png;base64,${d.b64_json}`)
    }

    if (images.length === 0) throw new Error('IMAGE_GENERATION_FAILED')

    await rpc(admin, 'log_token_spend', { p_workspace_id: workspace.id, p_user_id: user.id, p_amount: totalCost, p_model_id: modelId, p_description: `image generation (${imageCount})` })
    reservedAmount = 0
    response.status(200).json({ images, modelId, tokenCost: totalCost })
  } catch (error) {
    if (reservedAmount > 0 && adminRef) {
      await rpc(adminRef, 'refund_tokens', { p_workspace_id: request.body.workspaceId, p_amount: reservedAmount })
    }
    if (error instanceof RateLimitError) return response.status(429).json({ error: `Слишком много запросов` })
    response.status(502).json({ error: 'Генерация изображения временно недоступна' })
  }
}
