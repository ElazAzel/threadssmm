export const CONTENT_CATEGORIES = [
  { value: 'educational', label: 'Образовательный', icon: '📚', description: 'Экспертные разборы, how-to, полезные советы' },
  { value: 'news_reaction', label: 'Реакция на новости', icon: '⚡', description: 'Комментарии к событиям в индустрии' },
  { value: 'product', label: 'Продуктовый', icon: '🚀', description: 'Обновления, кейсы, анонсы' },
  { value: 'thought_leadership', label: 'Экспертное мнение', icon: '💡', description: 'Прогнозы, аналитика, колонки' },
  { value: 'behind_scenes', label: 'За кулисами', icon: '🎬', description: 'Процессы, команда, культура' },
  { value: 'social_proof', label: 'Социальное доказательство', icon: '🏆', description: 'Отзывы, результаты, награды' },
  { value: 'engagement', label: 'Вовлечение', icon: '💬', description: 'Опросы, вопросы, дискуссии' },
  { value: 'curated', label: 'Курированный', icon: '📌', description: 'Репосты, подборки, дайджесты' },
  { value: 'personal', label: 'Личный бренд', icon: '👤', description: 'Истории, ценности, миссия' },
  { value: 'entertainment', label: 'Развлекательный', icon: '🎯', description: 'Мемы, юмор, викторины' },
] as const

export type ContentCategory = typeof CONTENT_CATEGORIES[number]['value']

export function getCategoryLabel(value: string): string {
  return CONTENT_CATEGORIES.find((c) => c.value === value)?.label ?? value
}

export function getCategoryIcon(value: string): string {
  return CONTENT_CATEGORIES.find((c) => c.value === value)?.icon ?? '📄'
}
