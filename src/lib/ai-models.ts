export interface AiModel {
  id: string
  provider: 'google' | 'anthropic' | 'openai'
  label: string
  description: string
  tokenCost: number
  maxTokens: number
  isDefault?: boolean
}

export const AI_MODELS: AiModel[] = [
  { id: 'gemini-2.0-flash', provider: 'google', label: 'Gemini 2.0 Flash', description: 'Быстрый, для повседневных задач', tokenCost: 1, maxTokens: 8192, isDefault: true },
  { id: 'gemini-2.5-flash', provider: 'google', label: 'Gemini 2.5 Flash', description: 'Сбалансированный скорость/качество', tokenCost: 2, maxTokens: 32768 },
  { id: 'gemini-2.5-pro', provider: 'google', label: 'Gemini 2.5 Pro', description: 'Максимальное качество, глубокий анализ', tokenCost: 5, maxTokens: 65536 },
]

export function getDefaultModel(): AiModel {
  return AI_MODELS.find((m) => m.isDefault) ?? AI_MODELS[0]
}

export function getModelById(id: string): AiModel | undefined {
  return AI_MODELS.find((m) => m.id === id)
}

export function calculateTokenCost(modelId: string, generations: number): number {
  const model = getModelById(modelId)
  if (!model) return generations
  return model.tokenCost * generations
}
