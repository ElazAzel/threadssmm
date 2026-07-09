export interface VariantOutput { id: string; tone: string; text: string; hookScore: number; complianceScore: number; complianceNote: string }

function buildSystemPrompt(format: string, riskTolerance: number, brand: Record<string, unknown> | null): string {
  return [
    'Ты редактор русскоязычного Threads-контента.',
    'Не придумывай цифры, факты, клиентов и результаты.',
    `Формат: ${format}. Каждый вариант не длиннее 500 символов.`,
    `Допустимый риск формулировок: ${riskTolerance} из 100.`,
    brand ? `Бренд: ${brand.name || 'не указан'}. Ниша: ${brand.niche || 'не указана'}.` : '',
    brand ? `Аудитория: ${brand.audience || 'не указана'}. Тон: ${brand.tone_of_voice || 'ясный и профессиональный'}.` : '',
    'Ответь строго в JSON: {"variants":[{"id":"A","tone":"...","text":"...","hookScore":0,"complianceScore":0,"complianceNote":"..."}]}',
  ].filter(Boolean).join('\n')
}

async function callChatCompletions(apiKey: string, baseUrl: string, model: string, prompt: string, format: string, riskTolerance: number, brand: Record<string, unknown> | null): Promise<VariantOutput[]> {
  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: buildSystemPrompt(format, riskTolerance, brand) },
        { role: 'user', content: `Создай три варианта для Threads. Основная мысль: ${prompt.trim()}` },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 2000,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OPENAI_API_ERROR: ${res.status} ${err.slice(0, 200)}`)
  }
  const data = await res.json() as { choices: Array<{ message: { content: string } }> }
  return parseVariants(data.choices?.[0]?.message?.content)
}

export async function callOpenAI(modelId: string, prompt: string, format: string, riskTolerance: number, brand: Record<string, unknown> | null): Promise<VariantOutput[]> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY_NOT_CONFIGURED')
  return callChatCompletions(apiKey, 'https://api.openai.com', modelId, prompt, format, riskTolerance, brand)
}

export async function callOpenAICompatible(baseUrl: string, apiKeyEnv: string, modelId: string, prompt: string, format: string, riskTolerance: number, brand: Record<string, unknown> | null): Promise<VariantOutput[]> {
  const apiKey = process.env[apiKeyEnv]
  if (!apiKey) throw new Error(`${apiKeyEnv}_NOT_CONFIGURED`)
  return callChatCompletions(apiKey, baseUrl, modelId, prompt, format, riskTolerance, brand)
}

function parseVariants(raw: string | undefined | null): VariantOutput[] {
  const parsed = JSON.parse(raw || '{"variants":[]}') as { variants?: VariantOutput[] }
  if (!parsed.variants || parsed.variants.length !== 3) throw new Error('INVALID_MODEL_RESPONSE')
  return parsed.variants.map((item, index) => ({
    id: (['A', 'B', 'C'] as const)[index],
    tone: (item.tone || '').slice(0, 80),
    text: (item.text || '').trim().slice(0, 500),
    hookScore: Math.max(0, Math.min(10, Number(item.hookScore) || 0)),
    complianceScore: Math.max(0, Math.min(100, Number(item.complianceScore) || 0)),
    complianceNote: String(item.complianceNote || 'Проверено').slice(0, 180),
  }))
}
