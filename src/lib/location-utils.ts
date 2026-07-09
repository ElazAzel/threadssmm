import type { Location } from './domain'
import type { AudienceSegment } from './domain'

export function adaptForLocation(
  content: string,
  location: Location,
  segment?: AudienceSegment
): string {
  let result = content

  if (location.local_business_terms.length > 0) {
    result = result.replace(/\bдолларов\b/gi, location.currency === '₸' ? 'тенге' : location.currency)
    result = result.replace(/\bрублей\b/gi, location.currency === '₸' ? 'тенге' : location.currency)
    result = result.replace(/\busd\b/gi, location.currency === '₸' ? 'KZT' : location.currency)
  }

  if (location.local_examples.length > 0) {
    for (const example of location.local_examples) {
      result = result.replace(/например, [^.,]+/gi, `например, ${example}`)
    }
  }

  if (location.local_references.length > 0) {
    for (const ref of location.local_references) {
      result = result.replace(/как в [A-Z][a-z]+/g, `как в ${ref}`)
    }
  }

  if (location.local_context) {
    const contextPatterns = [
      /для рынка [А-Я][а-я]+/g,
      /для предпринимателей/gi,
    ]
    for (const pattern of contextPatterns) {
      result = result.replace(pattern, (match) => `${match} ${location.local_context}`)
    }
  }

  if (segment?.communication.language === 'kk' && location.language === 'kk') {
    result = result
      .replace(/спасибо/gi, 'рахмет')
      .replace(/пожалуйста/gi, 'өтінемін')
      .replace(/здравствуйте/gi, 'сәлеметсіз бе')
  }

  if (segment?.communication.language === 'en' && location.language === 'en') {
    result = `[EN] ${result}`
  }

  return result
}

export function getTimezoneOffset(timezone: string): number {
  const map: Record<string, number> = {
    'Asia/Almaty': 5,
    'Asia/Astana': 5,
    'Asia/Shanghai': 8,
    'Asia/Dubai': 4,
    'Europe/Moscow': 3,
    'Europe/London': 0,
    'America/New_York': -5,
    'America/Los_Angeles': -8,
    'UTC': 0,
  }
  return map[timezone] ?? 0
}

export function getBestPostingHours(location: Location): number[] {
  const start = location.post_hours?.start ?? 10
  const end = location.post_hours?.end ?? 20

  const hours: number[] = []
  for (let h = start; h <= end; h += 2) {
    hours.push(h)
  }

  return hours
}

export function formatLocalPrice(amount: number, location: Location): string {
  const symbolMap: Record<string, string> = {
    '₸': '₸',
    '$': '$',
    '€': '€',
    '₽': '₽',
  }
  const symbol = symbolMap[location.currency] ?? location.currency
  return `${amount.toLocaleString()} ${symbol}`
}

export function getLocalTime(timezone: string): string {
  try {
    const now = new Date()
    return now.toLocaleTimeString('ru-RU', { timeZone: timezone, hour: '2-digit', minute: '2-digit' })
  } catch {
    return new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  }
}

export function detectLocationFromInput(input: string): string | null {
  const cities = [
    'алматы', 'астана', 'казахстан', 'москва', 'спб', 'нью-йорк', 'лондон',
    'дубай', 'сингапур', 'берлин', 'париж',
  ]

  const lower = input.toLowerCase()
  const found = cities.find(city => lower.includes(city))
  return found ?? null
}
