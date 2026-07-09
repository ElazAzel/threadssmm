export interface RiskAssessmentInput {
  text: string
  targetType: 'post' | 'comment' | 'draft' | 'campaign'
  brand?: {
    name?: string
    tone_of_voice?: string
    content_pillars?: string[]
    risk_tolerance?: number
    forbidden_topics?: string[]
  }
  context?: {
    recentTexts?: string[]
    postingFrequency?: number
    postingLimit?: number
    isApproved?: boolean
    location?: string
  }
}

export interface RiskAssessmentResult {
  score: number
  verdict: 'safe' | 'low_risk' | 'needs_review' | 'high_risk' | 'blocked'
  factors: Record<string, number>
  warnings: string[]
  recommendations: string[]
}

const SPAM_PATTERNS = [
  /\b(отличный пост|классная статья|согласен|полностью поддерживаю)\b/iu,
  /http[s]?:\/\/[^\s,]+/g,
  /(?:купить|заказать|оформить|приобрести)\s+(?:со\s)?скидк/i,
  /100%\s*(?:бесплатно|бесплатный|гарантия|результат)/iu,
  /(?:перейди|перейдите)\s+(?:по\s)?ссылк/i,
  /(?:заработок|заработать|прибыль)\s+(?:без|онлайн|легко)/iu,
  /только\s+сегодня/iu,
  /уникальн(?:ый|ая|ое)\s+предложени/iu,
]

const TOXIC_PATTERNS = [
  /(?:идиот|дурак|тупой|кретин)/iu,
  /(?:ненавижу|терпеть не могу|бесит)/iu,
  /(?:удали свой|закрой|заткнись)/iu,
  /(?:фашист|нацист|расист)/iu,
  /(?:дискриминаци)/iu,
  /(?:политик(?:а|и)|коррупци)/iu,
]

const POLITICAL_KEYWORDS = [
  'война', 'санкции', 'политика', 'президент', 'правительство',
  'режим', 'оппозиция', 'теракт', 'экстремизм',
]

const ENGAGEMENT_BAIT_PATTERNS = [
  /лайкни|❤️|👇|\d+\s+лайк/iu,
  /отметь\s+друз/i,
  /сохрани\s+пост/iu,
  /подпишись\s+и\s+получи/iu,
  /отпишись,?\s+если/iu,
]

export function assessRisk(input: RiskAssessmentInput): RiskAssessmentResult {
  const text = input.text || ''
  const factors: Record<string, number> = {}

  let duplicateTextScore = 0
  if (input.context?.recentTexts && input.context.recentTexts.length > 0) {
    const similarity = input.context.recentTexts.map(t => {
      const minLen = Math.min(t.length, text.length)
      if (minLen < 10) return 0
      let matches = 0
      for (let i = 0; i < minLen - 5; i++) {
        if (t.slice(i, i + 10) === text.slice(i, i + 10)) matches++
      }
      return matches / (minLen - 5)
    })
    duplicateTextScore = Math.max(...similarity, 0) * 100
  }
  factors.duplicateText = duplicateTextScore

  let postingFrequencyScore = 0
  if (input.context?.postingFrequency !== undefined && input.context?.postingLimit !== undefined) {
    postingFrequencyScore = (input.context.postingFrequency / input.context.postingLimit) * 100
  }
  factors.postingFrequency = postingFrequencyScore

  let spamPatternScore = 0
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(text)) spamPatternScore += 15
  }
  factors.spamPatterns = Math.min(spamPatternScore, 100)

  let engagementBaitScore = 0
  for (const pattern of ENGAGEMENT_BAIT_PATTERNS) {
    if (pattern.test(text)) engagementBaitScore += 10
  }
  factors.engagementBait = Math.min(engagementBaitScore, 100)

  let toxicityScore = 0
  for (const pattern of TOXIC_PATTERNS) {
    if (pattern.test(text)) toxicityScore += 25
  }
  factors.toxicity = Math.min(toxicityScore, 100)

  let politicalScore = 0
  for (const word of POLITICAL_KEYWORDS) {
    if (text.toLowerCase().includes(word)) politicalScore += 20
  }
  factors.politicalSensitivity = Math.min(politicalScore, 100)

  let brandViolationScore = 0
  if (input.brand?.forbidden_topics) {
    for (const topic of input.brand.forbidden_topics) {
      if (text.toLowerCase().includes(topic.toLowerCase())) brandViolationScore += 30
    }
  }
  factors.brandViolation = Math.min(brandViolationScore, 100)

  let blacklistedWords = 0
  const blacklisted = ['в современном мире', 'cutting-edge', 'революционный', 'best-in-class']
  for (const word of blacklisted) { if (text.toLowerCase().includes(word)) blacklistedWords += 20 }
  factors.blacklistedWords = Math.min(blacklistedWords, 100)

  const warningScore = Object.values(factors).reduce((a, b) => a + b, 0)
  const numFactors = Object.keys(factors).length || 1
  const baseScore = warningScore / (numFactors * 1.2)

  const riskTolerance = input.brand?.risk_tolerance ?? 50
  const normalizedTolerance = riskTolerance / 100
  const finalScore = Math.round(baseScore * (1 + (1 - normalizedTolerance) * 0.3))

  const warnings: string[] = []
  const recommendations: string[] = []

  if (factors.duplicateText > 60) {
    warnings.push('Текст похож на ранее опубликованные — измените формулировку')
    recommendations.push('Перепишите уникальным образом, сохранив смысл')
  }
  if (factors.spamPatterns > 40) {
    warnings.push('Обнаружены спам-паттерны (общие фразы, ссылки)')
    recommendations.push('Уберите шаблонные выражения и ссылки')
  }
  if (factors.engagementBait > 40) {
    warnings.push('Похоже на engagement bait — Meta снижает видимость таких постов')
    recommendations.push('Замените прямой призыв на естественный диалог')
  }
  if (factors.toxicity > 30) {
    warnings.push('Обнаружен токсичный или агрессивный тон')
    recommendations.push('Смягчите формулировки, используйте уважительный тон')
  }
  if (factors.politicalSensitivity > 40) {
    warnings.push('Затронуты политические темы — высокий риск')
    recommendations.push('Избегайте политических тем или получите approval')
  }
  if (factors.brandViolation > 30) {
    warnings.push('Текст нарушает правила бренда')
    recommendations.push('Проверьте запрещённые темы бренда')
  }
  if (factors.blacklistedWords > 40) {
    warnings.push('Использованы фразы, звучащие как AI-сгенерированные')
    recommendations.push('Перепишите естественным языком')
  }
  if (postingFrequencyScore > 80) {
    warnings.push('Слишком высокая частота публикаций')
    recommendations.push('Снизьте частоту или распределите по времени')
  }

  let verdict: RiskAssessmentResult['verdict'] = 'safe'
  if (finalScore > 80) verdict = 'blocked'
  else if (finalScore > 60) verdict = 'high_risk'
  else if (finalScore > 40) verdict = 'needs_review'
  else if (finalScore > 20) verdict = 'low_risk'

  return {
    score: finalScore,
    verdict,
    factors,
    warnings,
    recommendations,
  }
}
