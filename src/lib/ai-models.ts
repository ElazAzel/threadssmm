export type AiCategory = 'text_visual' | 'text_only' | 'visual_only'

export interface AiModel {
  id: string
  provider: 'google' | 'openai' | 'grok' | 'anthropic' | 'deepseek'
  label: string
  description: string
  category: AiCategory
  tokenCost: number
  maxTokens: number
  tier: 'budget' | 'mid' | 'flagship'
  isDefault?: boolean
}

export const AI_MODELS: AiModel[] = [
  // ─── Google Gemini ─────────────────────────────
  { id: 'gemini-2.0-flash-lite', provider: 'google', label: 'Gemini 2.0 Flash-Lite', description: 'Максимум экономии, для классификации', category: 'text_only', tokenCost: 1, maxTokens: 8192, tier: 'budget' },
  { id: 'gemini-2.0-flash', provider: 'google', label: 'Gemini 2.0 Flash', description: 'Лёгкий, для простых запросов', category: 'text_only', tokenCost: 1, maxTokens: 8192, tier: 'budget', isDefault: true },
  { id: 'gemini-2.5-flash', provider: 'google', label: 'Gemini 2.5 Flash', description: 'Сбалансированный, повседневные задачи', category: 'text_only', tokenCost: 2, maxTokens: 32768, tier: 'mid' },
  { id: 'gemini-2.5-pro', provider: 'google', label: 'Gemini 2.5 Pro', description: 'Флагман Google: текст + Imagen 3', category: 'text_visual', tokenCost: 8, maxTokens: 65536, tier: 'flagship' },
  { id: 'imagen-3', provider: 'google', label: 'Imagen 3', description: 'Генерация изображений Google', category: 'visual_only', tokenCost: 10, maxTokens: 0, tier: 'flagship' },

  // ─── OpenAI GPT ────────────────────────────────
  { id: 'gpt-4o-mini', provider: 'openai', label: 'GPT-4o Mini', description: 'Лёгкий и быстрый, для рутины', category: 'text_only', tokenCost: 2, maxTokens: 16384, tier: 'budget' },
  { id: 'gpt-4o', provider: 'openai', label: 'GPT-4o', description: 'Флагман OpenAI: текст + DALL·E 3', category: 'text_visual', tokenCost: 7, maxTokens: 32768, tier: 'flagship' },
  { id: 'dall-e-3', provider: 'openai', label: 'DALL·E 3', description: 'Генерация изображений OpenAI', category: 'visual_only', tokenCost: 12, maxTokens: 0, tier: 'flagship' },

  // ─── Grok (xAI) ────────────────────────────────
  { id: 'grok-3-mini', provider: 'grok', label: 'Grok 3 Mini', description: 'Лёгкий Grok, повседневные задачи', category: 'text_only', tokenCost: 2, maxTokens: 16384, tier: 'budget' },
  { id: 'grok-3', provider: 'grok', label: 'Grok 3', description: 'Флагман xAI: текст + Flux', category: 'text_visual', tokenCost: 6, maxTokens: 32768, tier: 'flagship' },

  // ─── Anthropic Claude ──────────────────────────
  { id: 'claude-haiku-3', provider: 'anthropic', label: 'Claude Haiku 3', description: 'Быстрый и лёгкий Claude', category: 'text_only', tokenCost: 4, maxTokens: 16384, tier: 'mid' },
  { id: 'claude-sonnet-4', provider: 'anthropic', label: 'Claude Sonnet 4', description: 'Глубокий анализ, тренды, код', category: 'text_only', tokenCost: 8, maxTokens: 65536, tier: 'flagship' },
  { id: 'claude-opus-4', provider: 'anthropic', label: 'Claude Opus 4', description: 'Максимальное качество, сложные задачи', category: 'text_only', tokenCost: 15, maxTokens: 131072, tier: 'flagship' },

  // ─── DeepSeek ──────────────────────────────────
  { id: 'deepseek-v3', provider: 'deepseek', label: 'DeepSeek V3', description: 'Мощный и дешёвый, для объёмов', category: 'text_only', tokenCost: 1, maxTokens: 32768, tier: 'budget' },
  { id: 'deepseek-r1', provider: 'deepseek', label: 'DeepSeek R1', description: 'С рассуждением, для сложных задач', category: 'text_only', tokenCost: 3, maxTokens: 32768, tier: 'mid' },
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
