import type { Brand } from '../domain'
import { formatBrandVoicePrompt, type BrandVoiceSelection } from '../brand-voice'
import { FORBIDDEN_PHRASES, type ContextResult } from './types'

export interface ContextBuilderInput {
  brand: Brand | null
  recentPosts: string
}

function buildPlatformRules(): string {
  return [
    'Платформа: Threads (социальная сеть Meta).',
    'Максимальная длина: 500 символов.',
    'Максимум ссылок: 5.',
    'Запрещены: агрессивные продажи, спам, вводящие в заблуждение утверждения.',
    'Оптимальный формат: короткие абзацы (1-3 строки), живые формулировки.',
  ].join('\n')
}

export function buildContext(input: ContextBuilderInput): ContextResult {
  const { brand, recentPosts } = input
  const brandVoice = brand?.tone_of_voice
    ? formatBrandVoicePrompt(brand as unknown as BrandVoiceSelection)
    : ''

  return {
    brandName: brand?.name || 'Бренд не указан',
    brandVoice,
    platformRules: buildPlatformRules(),
    offer: brand?.product || '',
    audience: brand?.audience || '',
    positioning: brand?.positioning || '',
    usp: brand?.usp || '',
    contentPillars: brand?.content_pillars || [],
    ctas: brand?.ctas || [],
    forbiddenTopics: brand?.forbidden_topics || [],
    forbiddenPhrases: FORBIDDEN_PHRASES,
    goodExamples: brand?.good_examples || '',
    badExamples: brand?.bad_examples || '',
    recentPosts,
  }
}
