export interface TimeSlot {
  hour: number
  dayOfWeek: number
  score: number
}

export interface BestTimeResult {
  recommendedHour: number
  recommendedDay: string
  confidence: 'high' | 'medium' | 'low'
  slots: TimeSlot[]
}

const DAY_NAMES = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']

export function calculateBestTime(publishedTimes: Array<{ hour: number; dayOfWeek: number; views?: number; likes?: number }>): BestTimeResult {
  if (publishedTimes.length === 0) {
    return {
      recommendedHour: 11,
      recommendedDay: 'Вторник',
      confidence: 'low',
      slots: [],
    }
  }

  const engagementBySlot = new Map<string, { count: number; totalEngagement: number }>()

  for (const pt of publishedTimes) {
    const key = `${pt.dayOfWeek}-${pt.hour}`
    const existing = engagementBySlot.get(key) ?? { count: 0, totalEngagement: 0 }
    existing.count++
    existing.totalEngagement += (pt.views ?? 0) + (pt.likes ?? 0) * 2
    engagementBySlot.set(key, existing)
  }

  const slots: TimeSlot[] = []
  for (const [key, value] of engagementBySlot) {
    const [dayOfWeek, hour] = key.split('-').map(Number)
    slots.push({
      hour,
      dayOfWeek,
      score: value.totalEngagement / value.count,
    })
  }

  slots.sort((a, b) => b.score - a.score)

  if (slots.length === 0) {
    return {
      recommendedHour: 11,
      recommendedDay: 'Вторник',
      confidence: 'low',
      slots: [],
    }
  }

  const best = slots[0]
  const confidence: BestTimeResult['confidence'] = publishedTimes.length < 5 ? 'low' : publishedTimes.length < 20 ? 'medium' : 'high'

  return {
    recommendedHour: best.hour,
    recommendedDay: DAY_NAMES[best.dayOfWeek] ?? 'Понедельник',
    confidence,
    slots: slots.slice(0, 10),
  }
}

export function getDefaultBestTime(): BestTimeResult {
  return {
    recommendedHour: 11,
    recommendedDay: 'Вторник',
    confidence: 'low',
    slots: [
      { hour: 11, dayOfWeek: 2, score: 100 },
      { hour: 10, dayOfWeek: 3, score: 85 },
      { hour: 14, dayOfWeek: 1, score: 72 },
      { hour: 9, dayOfWeek: 4, score: 68 },
    ],
  }
}

export function formatBestTimeSuggestion(result: BestTimeResult): string {
  const confidenceLabel = { high: 'Высокая', medium: 'Средняя', low: 'Низкая (мало данных)' }
  return `Лучшее время: ${result.recommendedDay}, ${result.recommendedHour}:00. Уверенность: ${confidenceLabel[result.confidence]}`
}
