import { callOpenAICompatible, type VariantOutput } from './openai.js'

export async function callDeepSeek(modelId: string, prompt: string, format: string, riskTolerance: number, brand: Record<string, unknown> | null): Promise<VariantOutput[]> {
  return callOpenAICompatible('https://api.deepseek.com', 'DEEPSEEK_API_KEY', modelId, prompt, format, riskTolerance, brand)
}
