import type { IntentResult, SlotResult, ContextResult, PromptPreset } from './types'
import { PRESETS } from './presets'

export interface ComposerInput {
  intent: IntentResult
  slots: SlotResult
  context: ContextResult
  presetId?: string
}

export function composeHiddenPrompt(input: ComposerInput): string {
  const { intent, slots, context } = input
  const preset = input.presetId ? PRESETS.find((p) => p.id === input.presetId) : null
  const parts: string[] = []

  parts.push('Ты SMM-редактор и копирайтер для социальной сети Threads.')

  const taskLine = [
    'Задача:',
    intent.intent === 'generate_post' ? 'Создай пост на русском языке.' :
    intent.intent === 'create_thread' ? 'Создай тред (серию постов) на русском языке.' :
    intent.intent === 'rewrite_post' ? 'Перепиши текст в заданном стиле.' :
    intent.intent === 'create_content_plan' ? 'Составь контент-план на указанную тему.' :
    intent.intent === 'create_reply' ? 'Напиши ответ на русском языке.' :
    'Создай контент для Threads.',
  ].join('\n')
  parts.push(taskLine)

  if (slots.topic) {
    parts.push(`Тема: "${slots.topic}."`)
  }

  if (slots.goal) {
    parts.push(`Цель: ${slots.goal}.`)
  }

  parts.push(`Формат: ${slots.format}.`)
  parts.push(`Платформа: ${slots.platform}.`)

  if (slots.language === 'ru') {
    parts.push('Язык: русский.')
  }

  if (context.brandName) {
    parts.push(``)
    parts.push('Контекст бренда:')
    parts.push(`- Бренд: ${context.brandName}.`)
    if (context.audience) parts.push(`- Целевая аудитория: ${context.audience}.`)
    if (context.offer) parts.push(`- Продукт: ${context.offer}.`)
    if (context.positioning) parts.push(`- Позиционирование: ${context.positioning}.`)
    if (context.usp) parts.push(`- УТП: ${context.usp}.`)
    if (context.contentPillars.length) parts.push(`- Контент-пиллары: ${context.contentPillars.join(', ')}.`)
    if (context.ctas.length) parts.push(`- Призывы к действию: ${context.ctas.join(', ')}.`)
    if (context.brandVoice) parts.push(`- Голос бренда: ${context.brandVoice}.`)
    if (context.forbiddenTopics.length) parts.push(`- Запрещённые темы: ${context.forbiddenTopics.join(', ')}.`)
  }

  parts.push(``)
  parts.push('Ограничения Threads:')
  parts.push(context.platformRules)

  if (context.forbiddenPhrases.length) {
    parts.push(``)
    parts.push('Слова и фразы, которые НЕЛЬЗЯ использовать:')
    context.forbiddenPhrases.forEach((p) => parts.push(`- "${p}"`))
  }

  if (slots.tone) {
    parts.push(``)
    parts.push(`Тон: ${slots.tone}.`)
  }

  if (slots.length) {
    parts.push(``)
    parts.push(`Длина: ${slots.length}.`)
  }

  if (slots.cta) {
    parts.push(``)
    parts.push(`CTA: мягкий призыв — ${slots.cta}.`)
  }

  parts.push(``)
  parts.push('Структура:')
  switch (slots.format) {
    case 'post':
      parts.push('1. Хук — цепляющее начало (1-2 строки).')
      parts.push('2. Боль — проблема, которую решает тема.')
      parts.push('3. Польза — аргумент / решение / инсайт.')
      parts.push('4. CTA — мягкий призыв к действию.')
      break
    case 'thread':
      parts.push('1. Первый пост: хук + анонс темы.')
      parts.push('2-3. Раскрытие аргументов/шагов.')
      parts.push('4. Вывод + CTA.')
      break
    case 'reply':
      parts.push('1. Согласие / понимание контекста.')
      parts.push('2. Аргумент или дополнение.')
      parts.push('3. Вопрос для продолжения диалога.')
      break
    default:
      parts.push('- Сильный хук.')
      parts.push('- Основная мысль.')
      parts.push('- CTA.')
  }

  if (context.goodExamples) {
    parts.push(``)
    parts.push('Примеры хорошего стиля:')
    parts.push(context.goodExamples)
  }

  if (context.badExamples) {
    parts.push(``)
    parts.push('Чего избегать (плохие примеры):')
    parts.push(context.badExamples)
  }

  parts.push(``)
  parts.push('Важно:')
  parts.push('- Не звучать как ИИ.')
  parts.push('- Не придумывать цифры, факты и результаты.')
  parts.push('- Короткие предложения, живые формулировки.')
  parts.push('- Без канцелярита ("осуществляется", "является", "представляет собой").')
  parts.push('- Без избитых фраз ("в современном мире", "инновационные решения").')
  parts.push(`- Допустимый риск формулировок: ${context.forbiddenTopics.length ? 'низкий' : 'средний'}.`)

  if (preset) {
    parts.push(``)
    parts.push(`Пресет: ${preset.label}.`)
    if (preset.systemPrompt) {
      parts.push(preset.systemPrompt)
    }
  }

  return parts.join('\n')
}

export function getMatchingPreset(slots: SlotResult, raw: string): PromptPreset | null {
  for (const preset of PRESETS) {
    const matchText = preset.description.toLowerCase()
    const keywords = matchText.split(' ')
    const matchCount = keywords.filter((kw) => raw.toLowerCase().includes(kw) || slots.topic?.toLowerCase().includes(kw)).length
    if (matchCount / keywords.length > 0.3) return preset
  }
  return null
}
