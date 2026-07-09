import type { ContentFormat } from '../domain'
import type { SlotResult } from './types'

const TOPIC_PATTERNS = [
  /(?:про|о(?:б)?|на тему)\s+[""""]?(.+?)[""""]?(?:\s*[,.!?]|$)/i,
  /(?:пост|текст|публикация)\s+(?:об?|про)\s+(.+)/i,
]

const TONE_KEYWORDS: Record<string, string> = {
  живой: 'живой, разговорный',
  простой: 'простой, без сложных терминов',
  экспертный: 'экспертный, авторитетный',
  дерзкий: 'дерзкий, смелый',
  продающий: 'продающий, с фокусом на выгоду',
  ироничный: 'ироничный, с лёгким юмором',
  официальный: 'официальный, деловой',
  теплый: 'тёплый, человечный',
  короткий: 'короткий, лаконичный',
  вовлекающий: 'вовлекающий, интерактивный',
}

const AUDIENCE_KEYWORDS: Record<string, string> = {
  предпринимател: 'предприниматели, владельцы бизнеса',
  маркетолог: 'маркетологи, SMM-специалисты',
  разработчик: 'разработчики, IT-специалисты',
  дизайнер: 'дизайнеры, креативные специалисты',
  стартап: 'основатели стартапов',
  руководител: 'руководители, топ-менеджмент',
  владелец: 'владельцы бизнеса',
  эксперт: 'эксперты, профессионалы',
}

const GOAL_KEYWORDS: Record<string, string> = {
  заявк: 'получить входящие заявки',
  продаж: 'увеличить продажи',
  охват: 'увеличить охваты',
  вовлечени: 'повысить вовлечённость',
  экспертност: 'укрепить экспертность',
  подписчик: 'привлечь подписчиков',
  лид: 'генерация лидов',
  узнаваемост: 'повысить узнаваемость бренда',
}

function extractPattern(text: string, patterns: RegExp[]): string | null {
  for (const p of patterns) {
    const match = text.match(p)
    if (match?.[1]) return match[1].trim()
  }
  return null
}

function keywordMatch(text: string, dict: Record<string, string>): string | null {
  for (const [key, value] of Object.entries(dict)) {
    if (text.toLowerCase().includes(key.toLowerCase())) return value
  }
  return null
}

export function extractSlots(raw: string): SlotResult {
  const topic = extractPattern(raw, TOPIC_PATTERNS) || raw.replace(/^(создай|напиши|сделай|сгенерируй|перепиши|переделай)\s*/i, '').trim()
  const tone = keywordMatch(raw, TONE_KEYWORDS)
  const audience = keywordMatch(raw, AUDIENCE_KEYWORDS)
  const goal = keywordMatch(raw, GOAL_KEYWORDS)

  const format: ContentFormat = /тред/i.test(raw) ? 'thread' : /ответ|комментарий/i.test(raw) ? 'reply' : 'post'

  const ctaMatch = raw.match(/(?:cta|призыв|ссылка|whatsapp|telegram|сайт)/i)
  const lengthMatch = raw.match(/(коротк|длинн|до\s*\d{3}|500\s*симв)/i)

  return {
    topic: topic || null,
    format,
    tone: tone || null,
    audience: audience || null,
    goal: goal || null,
    cta: ctaMatch ? ctaMatch[0] : null,
    length: lengthMatch ? 'до 500 символов' : null,
    language: 'ru',
    platform: 'Threads',
  }
}
