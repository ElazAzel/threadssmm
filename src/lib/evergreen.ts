export const EVERGREEN_INTERVALS = [
  { value: 'none', label: 'Однократно' },
  { value: '7d', label: 'Каждую неделю' },
  { value: '14d', label: 'Каждые 2 недели' },
  { value: '30d', label: 'Каждый месяц' },
  { value: '90d', label: 'Каждый квартал' },
] as const

export type EvergreenInterval = typeof EVERGREEN_INTERVALS[number]['value']

export const EVERGREEN_TEMPLATES = [
  {
    id: 't1',
    name: 'Экспертный пост',
    description: 'Полезный совет или инсайт для аудитории',
    content: '💡 Совет дня: {topic}\n\n• {point1}\n• {point2}\n• {point3}\n\nСохраните, чтобы не потерять ↓',
    suggestedCategory: 'educational',
  },
  {
    id: 't2',
    name: 'Вовлекающий вопрос',
    description: 'Опрос или вопрос для обсуждения',
    content: '🤔 {question}\n\nВарианты:\nA) {option_a}\nB) {option_b}\nC) {option_c}\n\nПишите в комментариях! 👇',
    suggestedCategory: 'engagement',
  },
  {
    id: 't3',
    name: 'Кейс / результат',
    description: 'История успеха клиента или проекта',
    content: '📊 Результат {period}: {metric}\n\nКак мы это сделали:\n1. {step1}\n2. {step2}\n3. {step3}\n\n{cta}',
    suggestedCategory: 'social_proof',
  },
  {
    id: 't4',
    name: 'Новость + реакция',
    description: 'Комментарий к событию в индустрии',
    content: '⚡ {news_topic}\n\nНаше мнение: {opinion}\n\nПочему это важно:\n{reason}\n\nЧто делать: {action}',
    suggestedCategory: 'news_reaction',
  },
  {
    id: 't5',
    name: 'Продуктовый апдейт',
    description: 'Анонс нового функционала или улучшения',
    content: '🚀 Что нового: {feature}\n\nЗачем это нужно: {benefit}\n\nКак работает: {how_it_works}\n\nПопробуйте уже сегодня!',
    suggestedCategory: 'product',
  },
  {
    id: 't6',
    name: 'Мысль недели',
    description: 'Короткая экспертная мысль для вдохновения',
    content: '{thought}\n\nПочему это важно для {audience}:\n{explanation}\n\nСогласны? 👍👎',
    suggestedCategory: 'thought_leadership',
  },
] as const

export interface EvergreenTemplate {
  id: string
  name: string
  description: string
  content: string
  suggestedCategory: string
}

export function fillTemplate(template: EvergreenTemplate, variables: Record<string, string>): string {
  let result = template.content
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(`{${key}}`, value)
  }
  return result
}
