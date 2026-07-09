import type { AudienceSegment } from './domain'

export const SEGMENT_TYPES: { value: string; label: string }[] = [
  { value: 'entrepreneur', label: 'Предприниматели' },
  { value: 'startup_founder', label: 'Основатели стартапов' },
  { value: 'student', label: 'Студенты' },
  { value: 'marketer', label: 'Маркетологи' },
  { value: 'smm', label: 'SMM-специалисты' },
  { value: 'hr', label: 'HR-специалисты' },
  { value: 'ceo', label: 'CEO / Руководители' },
  { value: 'small_business', label: 'Владельцы малого бизнеса' },
  { value: 'corp', label: 'Корпорации' },
  { value: 'university', label: 'Университеты' },
  { value: 'investor', label: 'Инвесторы' },
  { value: 'developer', label: 'Разработчики' },
  { value: 'designer', label: 'Дизайнеры' },
  { value: 'creator', label: 'Креаторы' },
]

export const AWARENESS_LEVELS: { value: string; label: string }[] = [
  { value: 'cold', label: 'Холодная аудитория' },
  { value: 'warm', label: 'Тёплая аудитория' },
  { value: 'hot', label: 'Горячая аудитория' },
  { value: 'client', label: 'Текущие клиенты' },
  { value: 'partner', label: 'Партнёры' },
  { value: 'community', label: 'Комьюнити' },
]

export const ARCHETYPES: { value: string; label: string; description: string }[] = [
  { value: 'pragmatic', label: 'Прагматичные', description: 'Ценят практическую пользу и эффективность' },
  { value: 'ambitious', label: 'Амбициозные', description: 'Нацелены на рост и большие результаты' },
  { value: 'skeptic', label: 'Скептики', description: 'Нуждаются в доказательствах и логике' },
  { value: 'beginner', label: 'Новички', description: 'Требуют простых объяснений и поддержки' },
  { value: 'expert', label: 'Эксперты', description: 'Ожидают глубины и профессионального языка' },
  { value: 'tech_lover', label: 'Любители технологий', description: 'Открыты к новым инструментам и AI' },
]

export function getDefaultSegmentCommunication(segmentType: string) {
  const profiles: Record<string, Partial<AudienceSegment['communication']>> = {
    entrepreneur: { formality: 40, boldness: 50, humor: 20, language: 'ru', ctaFormulas: ['Напишите, покажу как', 'Оставьте заявку'], postFormats: ['кейс', 'разбор', 'инсайт'], forbiddenPhrases: [] },
    smm: { formality: 30, boldness: 40, humor: 40, language: 'ru', ctaFormulas: ['Сохраните, пригодится', 'Попробуйте'], postFormats: ['лайфхак', 'список', 'кейс'], forbiddenPhrases: [] },
    student: { formality: 20, boldness: 30, humor: 50, language: 'ru', ctaFormulas: ['Сохрани пост', 'Напиши, если хочешь узнать больше'], postFormats: ['совет', 'подборка', 'личное'], forbiddenPhrases: [] },
    ceo: { formality: 70, boldness: 50, humor: 10, language: 'ru', ctaFormulas: ['Можно начать с аудита', 'Запишитесь на демо'], postFormats: ['статья', 'кейс', 'аналитика'], forbiddenPhrases: [] },
    developer: { formality: 30, boldness: 40, humor: 30, language: 'en', ctaFormulas: ['Try it out', 'Star on GitHub'], postFormats: ['how-to', 'comparison', 'release'], forbiddenPhrases: [] },
  }

  return profiles[segmentType] ?? { formality: 50, boldness: 30, humor: 20, language: 'ru', ctaFormulas: [], postFormats: [], forbiddenPhrases: [] }
}

export function getDefaultPains(segmentType: string): string[] {
  const pains: Record<string, string[]> = {
    entrepreneur: ['Нехватка времени', 'Ручные процессы', 'Нет системности', 'Сложно найти клиентов'],
    smm: ['Много ручной работы', 'Нет идей для контента', 'Долгие согласования', 'Непонятно что работает'],
    student: ['Нет опыта', 'Сложно найти первую работу', 'Много конкуренции'],
    ceo: ['Низкая эффективность команд', 'Отсутствие автоматизации', 'Потеря денег на процессах'],
    developer: ['Сложные деплои', 'Микроменеджмент', 'Legacy код'],
    small_business: ['Маркетинг отнимает всё время', 'Нет бюджета на дорогие инструменты', 'Сложно конкурировать с крупными'],
  }
  return pains[segmentType] ?? ['Боль не определена']
}

export function getDefaultDesires(segmentType: string): string[] {
  const desires: Record<string, string[]> = {
    entrepreneur: ['Автоматизировать рутину', 'Увеличить прибыль', 'Масштабироваться'],
    smm: ['Контент-план на месяц за час', 'Понять что реально работает', 'Меньше правок'],
    student: ['Научиться востребованным навыкам', 'Получить первую работу', 'Выделиться'],
    ceo: ['Автоматизировать отчёты', 'Улучшить управляемость', 'Сократить издержки'],
    developer: ['Быстрее доставлять фичи', 'Чистый код', 'Лучшие практики'],
    small_business: ['Больше клиентов', 'Экономия времени', 'Предсказуемый маркетинг'],
  }
  return desires[segmentType] ?? ['Желание не определено']
}

export function suggestSegmentsForNiche(niche: string): string[] {
  const map: Record<string, string[]> = {
    it: ['developer', 'ceo', 'startup_founder'],
    marketing: ['marketer', 'smm', 'entrepreneur'],
    education: ['student', 'university', 'creator'],
    finance: ['ceo', 'investor', 'corp'],
    health: ['small_business', 'entrepreneur', 'creator'],
    ecommerce: ['small_business', 'entrepreneur', 'marketer'],
    agency: ['smm', 'marketer', 'ceo'],
    consulting: ['ceo', 'entrepreneur', 'corp'],
    creative: ['designer', 'creator', 'entrepreneur'],
  }

  const lower = niche.toLowerCase()
  for (const [key, segments] of Object.entries(map)) {
    if (lower.includes(key)) return segments
  }

  return ['entrepreneur', 'small_business']
}

export function adaptContentForSegment(
  content: string,
  segment: AudienceSegment
): string {
  let result = content

  const comm = segment.communication
  if (comm.formality > 50) {
    result = result.replace(/\bты\b/gi, 'Вы').replace(/\bтебе\b/gi, 'Вам')
  } else if (comm.formality < 30) {
    result = result.replace(/\bВы\b/g, 'ты').replace(/\bВам\b/g, 'тебе')
  }

  return result
}
