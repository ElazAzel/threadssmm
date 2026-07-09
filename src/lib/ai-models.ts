export type AiCategory = 'text_visual' | 'text_only' | 'visual_only'

export interface AiModel {
  id: string
  provider: 'google' | 'openai' | 'grok' | 'anthropic' | 'deepseek'
  label: string
  description: string
  category: AiCategory
  tokenCost: number
  maxTokens: number
  isDefault?: boolean
}

export const AI_MODELS: AiModel[] = [
  // ─── Google Gemini ─────────────────────────────
  { id: 'gemini-2.5-pro', provider: 'google', label: 'Gemini 2.5 Pro', description: 'Текст + изображения (Imagen)', category: 'text_visual', tokenCost: 5, maxTokens: 65536 },
  { id: 'gemini-2.5-flash', provider: 'google', label: 'Gemini 2.5 Flash', description: 'Быстрый, для повседневных задач', category: 'text_only', tokenCost: 2, maxTokens: 32768 },
  { id: 'gemini-2.0-flash', provider: 'google', label: 'Gemini 2.0 Flash', description: 'Лёгкий, для простых запросов', category: 'text_only', tokenCost: 1, maxTokens: 8192, isDefault: true },
  { id: 'imagen-3', provider: 'google', label: 'Imagen 3', description: 'Генерация изображений через Google', category: 'visual_only', tokenCost: 10, maxTokens: 0 },

  // ─── OpenAI GPT ────────────────────────────────
  { id: 'gpt-4o', provider: 'openai', label: 'GPT-4o', description: 'Текст + DALL·E 3 (изображения)', category: 'text_visual', tokenCost: 5, maxTokens: 32768 },
  { id: 'gpt-4o-mini', provider: 'openai', label: 'GPT-4o Mini', description: 'Быстрый, для повседневных задач', category: 'text_only', tokenCost: 2, maxTokens: 16384 },
  { id: 'dall-e-3', provider: 'openai', label: 'DALL·E 3', description: 'Генерация изображений через OpenAI', category: 'visual_only', tokenCost: 15, maxTokens: 0 },

  // ─── Grok (xAI) ────────────────────────────────
  { id: 'grok-3', provider: 'grok', label: 'Grok 3', description: 'Текст + Flux (изображения)', category: 'text_visual', tokenCost: 4, maxTokens: 32768 },
  { id: 'grok-3-mini', provider: 'grok', label: 'Grok 3 Mini', description: 'Быстрый, для повседневных задач', category: 'text_only', tokenCost: 2, maxTokens: 16384 },

  // ─── Anthropic Claude ──────────────────────────
  { id: 'claude-sonnet-4', provider: 'anthropic', label: 'Claude Sonnet 4', description: 'Глубокий анализ, тренды, исследования', category: 'text_only', tokenCost: 5, maxTokens: 65536 },
  { id: 'claude-haiku-3', provider: 'anthropic', label: 'Claude Haiku 3', description: 'Быстрый, лёгкий', category: 'text_only', tokenCost: 2, maxTokens: 16384 },

  // ─── DeepSeek ──────────────────────────────────
  { id: 'deepseek-v3', provider: 'deepseek', label: 'DeepSeek V3', description: 'Мощный, для тредов и аналитики', category: 'text_only', tokenCost: 2, maxTokens: 32768 },
  { id: 'deepseek-r1', provider: 'deepseek', label: 'DeepSeek R1', description: 'С рассуждением, для сложных задач', category: 'text_only', tokenCost: 3, maxTokens: 32768 },
]

export function getDefaultModel(): AiModel {
  return AI_MODELS.find((m) => m.isDefault) ?? AI_MODELS[0]
}

export function getModelById(id: string): AiModel | undefined {
  return AI_MODELS.find((m) => m.id === id)
}

export function getModelsByCategory(category: AiCategory): AiModel[] {
  return AI_MODELS.filter((m) => m.category === category)
}

export function calculateTokenCost(modelId: string, count: number): number {
  const model = getModelById(modelId)
  if (!model) return count
  return model.tokenCost * count
}

export const VALID_MODEL_IDS = AI_MODELS.map((m) => m.id)
