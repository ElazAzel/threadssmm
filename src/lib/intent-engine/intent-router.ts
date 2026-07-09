import type { Intent, IntentResult } from './types'

const INTENT_PATTERNS: Array<{ pattern: RegExp; intent: Intent; weight: number }> = [
  { pattern: /(создай|напиши|сделай|сгенерируй).*(пост|текст|публикацию)/i, intent: 'generate_post', weight: 0.9 },
  { pattern: /(создай|напиши|сделай).*(тред|серию|несколько постов)/i, intent: 'create_thread', weight: 0.95 },
  { pattern: /(создай|напиши|сделай).*(контент-план|план публикаций|расписание)/i, intent: 'create_content_plan', weight: 0.95 },
  { pattern: /(перепиши|переделай|переформулируй|улучши)/i, intent: 'rewrite_post', weight: 0.85 },
  { pattern: /(ответь|напиши ответ|комментарий)/i, intent: 'create_reply', weight: 0.85 },
  { pattern: /(проанализируй|новость|rss|прочитай)/i, intent: 'analyze_rss', weight: 0.8 },
  { pattern: /(запланируй|опубликуй|поставь в расписание)/i, intent: 'schedule_post', weight: 0.9 },
  { pattern: /(согласуй|отправь на согласование|апрув)/i, intent: 'approve_draft', weight: 0.85 },
  { pattern: /(сделай|напиши).*коротк/i, intent: 'generate_post', weight: 0.7 },
  { pattern: /(напиши|сделай).*в стил/i, intent: 'rewrite_post', weight: 0.75 },
]

export function detectIntent(raw: string): IntentResult {
  let best: IntentResult = { intent: 'unknown', confidence: 0 }

  for (const { pattern, intent, weight } of INTENT_PATTERNS) {
    if (pattern.test(raw)) {
      const confidence = weight
      if (confidence > best.confidence) {
        best = { intent, confidence }
      }
    }
  }

  return best
}
