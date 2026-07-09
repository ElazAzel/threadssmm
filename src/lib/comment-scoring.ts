import type { AudienceSegment, Location as BrandLocation } from './domain'

export interface CommentOpportunityInput {
  postText: string
  authorUsername?: string
  topic: string[]
  language: string
  location?: string
  freshnessHours: number
  conversationActivity: number
  toxicityRisk?: number
  spamRisk?: number
}

export interface CommentOpportunityScore {
  overall: number
  topicMatch: number
  audienceMatch: number
  locationMatch: number
  freshness: number
  activity: number
  authorRelevance: number
  leadPotential: number
  brandFit: number
  adjustedRisk: number
  verdict: 'high' | 'medium' | 'low' | 'avoid'
}

export function scoreCommentOpportunity(
  input: CommentOpportunityInput,
  brand: {
    contentPillars?: string[]
    targetAudiences?: string[]
    targetLocations?: string[]
    forbiddenTopics?: string[]
  },
  segments?: AudienceSegment[],
  locations?: BrandLocation[]
): CommentOpportunityScore {
  const { postText, topic, language, location, freshnessHours, conversationActivity } = input

  const topicMatch = scoreTopicMatch(topic, brand.contentPillars)
  const audienceMatch = scoreAudienceMatch(topic, language, segments)
  const locationMatch = scoreLocationMatch(location, brand.targetLocations, locations)
  const freshness = scoreFreshness(freshnessHours)
  const activity = scoreActivity(conversationActivity)
  const authorRelevance = scoreAuthorRelevance(input.authorUsername)
  const leadPotential = scoreLeadPotential(postText, topic)
  const brandFit = scoreBrandFit(topic, brand.forbiddenTopics)
  const toxicityRisk = input.toxicityRisk ?? 0
  const spamRisk = input.spamRisk ?? 0

  const adjustedRisk = (toxicityRisk * 0.15 + spamRisk * 0.20)
  const rawScore = (
    topicMatch * 0.20 +
    audienceMatch * 0.15 +
    locationMatch * 0.10 +
    freshness * 0.10 +
    activity * 0.10 +
    authorRelevance * 0.10 +
    leadPotential * 0.15 +
    brandFit * 0.10
  )

  const overall = Math.round(Math.max(0, rawScore - adjustedRisk) * 100) / 100

  let verdict: CommentOpportunityScore['verdict'] = 'low'
  if (overall >= 80) verdict = 'high'
  else if (overall >= 60) verdict = 'medium'
  else if (overall >= 40) verdict = 'low'
  else verdict = 'avoid'

  return {
    overall, topicMatch, audienceMatch, locationMatch,
    freshness, activity, authorRelevance, leadPotential, brandFit,
    adjustedRisk, verdict,
  }
}

function scoreTopicMatch(topics: string[], pillars?: string[]): number {
  if (!pillars || pillars.length === 0 || topics.length === 0) return 50
  let matchCount = 0
  for (const topic of topics) {
    for (const pillar of pillars) {
      if (topic.toLowerCase().includes(pillar.toLowerCase()) ||
          pillar.toLowerCase().includes(topic.toLowerCase())) {
        matchCount++
      }
    }
  }
  return Math.min(Math.round((matchCount / Math.max(topics.length, 1)) * 100), 100)
}

function scoreAudienceMatch(topic: string[], language: string, segments?: AudienceSegment[]): number {
  if (!segments || segments.length === 0) return 50
  let maxScore = 0
  for (const seg of segments) {
    const segTopics = seg.triggers.concat(seg.desires)
    let score = 0
    for (const st of segTopics) {
      for (const t of topic) {
        if (st.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(st.toLowerCase())) {
          score += 10
        }
      }
    }
    if (seg.communication.language === language) score += 20
    maxScore = Math.max(maxScore, score)
  }
  return Math.min(maxScore, 100)
}

function scoreLocationMatch(
  postLocation: string | undefined,
  targetLocations?: string[],
  brandLocations?: BrandLocation[]
): number {
  if (!postLocation) return 30
  const locs = targetLocations ?? brandLocations?.map(l => l.name.toLowerCase()) ?? []
  for (const loc of locs) {
    if (postLocation.toLowerCase().includes(loc.toLowerCase())) return 100
  }
  return 30
}

function scoreFreshness(hours: number): number {
  if (hours <= 1) return 100
  if (hours <= 4) return 90
  if (hours <= 12) return 70
  if (hours <= 24) return 50
  if (hours <= 72) return 20
  return 10
}

function scoreActivity(activity: number): number {
  if (activity >= 50) return 100
  if (activity >= 20) return 80
  if (activity >= 10) return 60
  if (activity >= 3) return 40
  return 20
}

function scoreAuthorRelevance(author?: string): number {
  if (!author) return 30
  return 50
}

function scoreLeadPotential(text: string, topics: string[]): number {
  const leadSignals = ['нужна помощь', 'подскажите', 'как сделать', 'кто может', 'стоит ли',
    'посоветуйте', 'рекомендуйте', 'ищу', 'интересует', 'проблема']
  let score = 0
  for (const signal of leadSignals) {
    if (text.toLowerCase().includes(signal)) score += 15
  }
  for (const topic of topics) {
    if (text.toLowerCase().includes(topic.toLowerCase())) score += 10
  }
  return Math.min(score, 100)
}

function scoreBrandFit(topics: string[], forbiddenTopics?: string[]): number {
  if (!forbiddenTopics || forbiddenTopics.length === 0) return 80
  for (const ft of forbiddenTopics) {
    for (const t of topics) {
      if (t.toLowerCase().includes(ft.toLowerCase())) return 0
    }
  }
  return 100
}

export function generateCommentVariants(postText: string, _tone: string): string[] {
  const variants: string[] = []

  const shortVariant = postText.length > 100
    ? postText.slice(0, 100).split(' ').slice(0, -1).join(' ') + '...'
    : postText

  variants.push(`${shortVariant}`)
  variants.push(`Интересная мысль. А как вы относитесь к внедрению такого подхода в малом бизнесе?`)

  return variants
}

export function generateCommentForTone(
  postText: string,
  tone: 'expert' | 'friendly' | 'ironic' | 'supportive' | 'controversial',
  brandHint?: string
): string[] {
  switch (tone) {
    case 'expert':
      return [
        `На основе нашего опыта с ${brandHint || 'аналогичными проектами'} могу сказать, что ключевой фактор успеха здесь — системный подход.`,
        `Хороший пример. В нашей практике такие сценарии требуют анализа трёх параметров: сроки, бюджет, команда.`,
      ]
    case 'friendly':
      return [
        `Круто, что поделились! У самих был похожий опыт, и он нас многому научил.`,
        `Отличная тема для обсуждения! Рады, что вы подняли этот вопрос.`,
      ]
    case 'supportive':
      return [
        `Полностью поддерживаем! Такие обсуждения очень важны для сообщества.`,
        `Спасибо, что делитесь опытом — это помогает всем нам расти.`,
      ]
    case 'controversial':
      return [
        `Интересная позиция, но есть и другая сторона. Что если посмотреть на это с точки зрения эффективности?`,
        `Спорный тезис. На практике мы видим обратную зависимость.`,
      ]
    default:
      return [
        `Полезный пост. Добавил бы ещё, что важно учитывать контекст.`,
      ]
  }
}
