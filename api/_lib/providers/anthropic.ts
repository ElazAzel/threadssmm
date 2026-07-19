export interface VariantOutput { id: string; tone: string; text: string; hookScore: number; complianceScore: number; complianceNote: string }

export async function callAnthropic(modelId: string, prompt: string, format: string, riskTolerance: number, brand: Record<string, unknown> | null): Promise<VariantOutput[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY_NOT_CONFIGURED')

  const systemPrompt = [
    'Ты редактор русскоязычного Threads-контента.',
    'Не придумывай цифры, факты, клиентов и результаты.',
    `Формат: ${format}. Каждый вариант не длиннее 500 символов.`,
    `Допустимый риск формулировок: ${riskTolerance} из 100.`,
    brand ? `Бренд: ${brand.name || 'не указан'}. Ниша: ${brand.niche || 'не указана'}.` : '',
    brand ? `Аудитория: ${brand.audience || 'не указана'}. Тон: ${brand.tone_of_voice || 'ясный и профессиональный'}.` : '',
    'Ответь строго в JSON. Без markdown, без обёрток ```json.',
  ].filter(Boolean).join('\n')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: modelId,
      system: systemPrompt,
      messages: [
        { role: 'user', content: `Создай три варианта для Threads. Основная мысль: ${prompt.trim()}\n\nОтветь JSON: {"variants":[{"id":"A","tone":"...","text":"...","hookScore":0,"complianceScore":0,"complianceNote":"..."}]}` },
      ],
      max_tokens: 2000,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`ANTHROPIC_API_ERROR: ${res.status} ${err.slice(0, 200)}`)
  }
  const data = await res.json() as { content: Array<{ text: string }> }
  const content = data.content?.[0]?.text
  if (!content) throw new Error('INVALID_MODEL_RESPONSE')
  return parseVariants(content)
}

function parseVariants(raw: string): VariantOutput[] {
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const parsed = JSON.parse(cleaned) as { variants?: VariantOutput[] }
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
