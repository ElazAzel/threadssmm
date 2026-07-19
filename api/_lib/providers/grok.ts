import { callOpenAICompatible, type VariantOutput } from './openai.js'

export async function callGrok(modelId: string, prompt: string, format: string, riskTolerance: number, brand: Record<string, unknown> | null): Promise<VariantOutput[]> {
  return callOpenAICompatible('https://api.x.ai', 'GROK_API_KEY', modelId, prompt, format, riskTolerance, brand)
}
