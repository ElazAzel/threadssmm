import type { CriticScore, ContextResult, SlotResult } from './types'

const HOOK_PATTERNS = [
  /^(почему|как|что если|представь|вы знали|секрет|ошибка|главный|3|5|7|10|почему\sне|а что|когда|стоит\sли)/i,
  /[!?]/,
  /^(я\s|мы\s|ты\s|вы\s)/i,
]

const CLICHE_PATTERNS = [
  /в современном мире/i,
  /инновационные решения/i,
  /уникальная возможность/i,
  /цифровая трансформация/i,
  /шаг в будущее/i,
  /новые горизонты/i,
  /стремительное развитие/i,
  /решение всех проблем/i,
  /неотъемлемая часть/i,
  /на сегодняшний день/i,
  /является/i,
  /осуществляется/i,
  /представляет собой/i,
]

const CTA_PATTERNS = [
  /напишите|напиши|перейди|перейдите|ссылка|жми|кликни|подпишись|подпишитесь|сохрани|сохраните|поделись/i,
  /whatsapp|telegram|instagram|ссылка в профиле/i,
]

export function critiqueVariant(
  text: string,
  context: ContextResult,
  slots: SlotResult,
): CriticScore {
  const issues: string[] = []
  const paragraphs = text.split('\n').filter(Boolean)
  const firstLine = paragraphs[0] || ''

  // Hook strength
  let hookStrength = 3
  if (firstLine.split(' ').length <= 10) hookStrength += 2
  if (HOOK_PATTERNS.some((p) => p.test(firstLine))) hookStrength += 3
  if (firstLine.length < 20) hookStrength += 2
  if (paragraphs.length > 1) hookStrength -= 1
  hookStrength = Math.max(1, Math.min(10, hookStrength))
  if (hookStrength < 5) issues.push('Слабый хук — начните с вопроса или неожиданного утверждения')

  // Clarity
  let clarity = 7
  if (CLICHE_PATTERNS.some((p) => p.test(text))) {
    clarity -= 3
    issues.push('Есть шаблонные фразы — уберите канцелярит')
  }
  if (text.length > 500) {
    clarity -= 1
    issues.push('Превышен лимит 500 символов')
  }
  clarity = Math.max(1, Math.min(10, clarity))

  // Human tone
  let humanTone = 6
  if (text.includes('—') || text.includes('–')) humanTone += 1
  if (/[!?]/.test(text)) humanTone += 1
  if (/[ямытывы]/.test(text)) humanTone += 1
  if (CLICHE_PATTERNS.some((p) => p.test(text))) humanTone -= 3
  if (paragraphs.length <= 3) humanTone += 1
  if (/\b(который|которая|которые|данный|данная)\b/i.test(text)) humanTone -= 1
  humanTone = Math.max(1, Math.min(10, humanTone))
  if (humanTone < 5) issues.push('Текст звучит как ИИ — добавьте живых формулировок')

  // Brand fit
  let brandFit = 7
  if (context.forbiddenPhrases.length) {
    const found = context.forbiddenPhrases.filter((p) => text.toLowerCase().includes(p.toLowerCase()))
    if (found.length) {
      brandFit -= found.length * 2
      issues.push(`Обнаружены запрещённые фразы: ${found.join(', ')}`)
    }
  }
  if (context.forbiddenTopics.length) {
    const found = context.forbiddenTopics.filter((t) => text.toLowerCase().includes(t.toLowerCase()))
    if (found.length) brandFit -= found.length * 2
  }
  brandFit = Math.max(1, Math.min(10, brandFit))

  // CTA quality
  let ctaQuality = 5
  if (slots.goal && slots.goal !== 'не указана') ctaQuality += 1
  if (CTA_PATTERNS.some((p) => p.test(text))) ctaQuality += 3
  const lastLine = paragraphs[paragraphs.length - 1] || ''
  if (lastLine.length < 40 && paragraphs.length > 1) ctaQuality += 1
  ctaQuality = Math.max(1, Math.min(10, ctaQuality))
  if (ctaQuality < 5) issues.push('Нет CTA или он слабый — добавьте мягкий призыв к действию')

  // Threads fit
  let threadsFit = 8
  if (text.length > 500) threadsFit -= 3
  if (paragraphs.length > 5) threadsFit -= 1
  if (!/[!?]/.test(text)) threadsFit -= 1
  if (text.split('\n').some((l) => l.length > 200)) threadsFit -= 1
  threadsFit = Math.max(1, Math.min(10, threadsFit))
  if (threadsFit < 5) issues.push('Формат не подходит для Threads — сделайте короче')

  const overall = Math.round((hookStrength + clarity + humanTone + brandFit + ctaQuality + threadsFit) / 6 * 10) / 10

  return {
    hookStrength,
    clarity,
    humanTone,
    brandFit,
    ctaQuality,
    threadsFit,
    overall,
    issues,
  }
}

export function generateRepairPrompt(variantText: string, score: CriticScore): string {
  const parts: string[] = ['Улучши следующий текст для Threads.']
  parts.push('Исходный текст:')
  parts.push(`"""${variantText}"""`)
  parts.push('')

  if (score.issues.length) {
    parts.push('Проблемы:')
    score.issues.forEach((issue) => parts.push(`- ${issue}`))
  }

  parts.push('')
  parts.push('Требования:')
  parts.push('- Сохрани основную мысль.')
  parts.push('- Улучши слабые места.')
  parts.push('- Не превышай 500 символов.')
  parts.push('- Сделай текст живым и человечным.')
  parts.push('- Добавь хук, если его нет.')
  parts.push('- Верни только исправленный текст без пояснений.')

  return parts.join('\n')
}
