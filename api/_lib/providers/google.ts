import { GoogleGenAI } from '@google/genai'

interface VariantOutput { id: string; tone: string; text: string; hookScore: number; complianceScore: number; complianceNote: string }

export async function callGoogle(modelId: string, prompt: string, format: string, riskTolerance: number, brand: Record<string, unknown> | null): Promise<VariantOutput[]> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY_NOT_CONFIGURED')

  const ai = new GoogleGenAI({ apiKey })
  const generation = await ai.models.generateContent({
    model: modelId,
    contents: `Создай три варианта для Threads. Формат: ${format}. Основная мысль: ${prompt.trim()}`,
    config: {
      systemInstruction: [
        'Ты редактор русскоязычного Threads-контента.',
        'Не придумывай цифры, факты, клиентов и результаты. Если данных нет, формулируй без неподтверждённых утверждений.',
        'Каждый вариант должен быть самостоятельным, естественным, без канцелярита и не длиннее 500 символов.',
        `Допустимый риск формулировок: ${riskTolerance} из 100.`,
        `Бренд: ${brand?.name || 'не указан'}. Ниша: ${brand?.niche || 'не указана'}. Продукт: ${brand?.product || 'не указан'}.`,
        `Аудитория: ${brand?.audience || 'не указана'}. Тон: ${brand?.tone_of_voice || 'ясный и профессиональный'}.`,
        `Контент-столпы: ${(brand?.content_pillars as string[] ?? []).join(', ') || 'не указаны'}.`,
        `CTA: ${(brand?.ctas as string[] ?? []).join(', ') || 'не указаны'}.`,
        `Запрещённые темы: ${(brand?.forbidden_topics as string[] ?? []).join(', ') || 'нет'}.`,
      ].join('\n'),
      responseMimeType: 'application/json',
      responseJsonSchema: {
        type: 'object',
        properties: {
          variants: {
            type: 'array', minItems: 3, maxItems: 3,
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
  return parseVariants(generation.text)
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
