export interface IncomingComment {
  id: string
  authorUsername: string
  text: string
  postText?: string
  language: string
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed'
  intent: 'question' | 'feedback' | 'complaint' | 'praise' | 'spam' | 'discussion' | 'other'
  urgency: 'low' | 'normal' | 'high'
  isLead: boolean
  createdAt: string
}

export interface ReplySuggestion {
  text: string
  tone: string
  riskScore: number
  suggestedAction: 'reply' | 'clarify' | 'move_to_dm' | 'ignore' | 'report'
  explanation: string
}

export function analyzeIncomingComment(comment: IncomingComment): {
  intent: IncomingComment['intent']
  sentiment: IncomingComment['sentiment']
  urgency: IncomingComment['urgency']
  isLead: boolean
  suggestedAction: ReplySuggestion['suggestedAction']
} {
  const text = comment.text.toLowerCase()

  let intent: IncomingComment['intent'] = 'other'
  let suggestedAction: ReplySuggestion['suggestedAction'] = 'reply'

  if (/как|почему|зачем|что|когда|где|сколько|помогите|подскажите/i.test(text)) {
    intent = 'question'
    suggestedAction = 'reply'
  } else if (/спасиб|благодар|класс|супер|отлично|круто/i.test(text)) {
    intent = 'praise'
    suggestedAction = 'reply'
  } else if (/(?:плохо|ужасно|не работает|разочарован|кошмар|жалоба)/i.test(text)) {
    intent = 'complaint'
    suggestedAction = 'move_to_dm'
  } else if (/(?:закакз|купить|цена|стоимость|хочу|интересует|сотрудничать)/i.test(text)) {
    intent = 'feedback'
    suggestedAction = 'move_to_dm'
    comment.isLead = true
  } else if (/(?:реклама|спам|подпишись|заработок|перейди)/i.test(text)) {
    intent = 'spam'
    suggestedAction = 'ignore'
  } else {
    intent = 'discussion'
    suggestedAction = 'reply'
  }

  let sentiment: IncomingComment['sentiment'] = 'neutral'
  if (/(?:отличн|классн|крут|спасиб|благодар|прекрасн|лучш)/i.test(text)) sentiment = 'positive'
  else if (/(?:плох|ужасн|кошмар|не нравится|разочар|бесполезн)/i.test(text)) sentiment = 'negative'

  let urgency: IncomingComment['urgency'] = 'normal'
  if (sentiment === 'negative' || intent === 'complaint' || comment.isLead) urgency = 'high'
  else if (intent === 'question' && /срочн|пожалуйста|быстр/i.test(text)) urgency = 'high'

  return {
    intent,
    sentiment: comment.sentiment || sentiment,
    urgency,
    isLead: comment.isLead,
    suggestedAction,
  }
}

export function generateReplySuggestions(
  comment: IncomingComment,
  _brandName?: string
): ReplySuggestion[] {
  const analysis = analyzeIncomingComment(comment)
  const suggestions: ReplySuggestion[] = []

  if (analysis.intent === 'question') {
    suggestions.push({
      text: `Спасибо за вопрос! ${comment.text.includes('?') ? 'Отвечая на ваш вопрос' : 'Давайте разберём'}...`,
      tone: 'helpful',
      riskScore: 5,
      suggestedAction: 'reply',
      explanation: 'Прямой ответ на вопрос — лучший способ показать экспертизу',
    })
    suggestions.push({
      text: `Хороший вопрос! Напишите в личные сообщения — покажу подробнее на вашем примере.`,
      tone: 'friendly',
      riskScore: 10,
      suggestedAction: 'move_to_dm',
      explanation: 'Перевод в DM повышает конверсию',
    })
  }

  if (analysis.intent === 'praise') {
    suggestions.push({
      text: `Спасибо! Очень ценно, что вы это отметили.`,
      tone: 'grateful',
      riskScore: 0,
      suggestedAction: 'reply',
      explanation: 'Благодарность укрепляет лояльность',
    })
  }

  if (analysis.intent === 'complaint') {
    suggestions.push({
      text: `Спасибо, что сообщили. Напишите нам в личные сообщения — разберёмся с вашей ситуацией.`,
      tone: 'empathetic',
      riskScore: 5,
      suggestedAction: 'move_to_dm',
      explanation: 'Перевод в DM для решения проблемы',
    })
    suggestions.push({
      text: `Нам очень жаль, что так вышло. Мы уже проверили и исправили. Спасибо за обратную связь!`,
      tone: 'apologetic',
      riskScore: 15,
      suggestedAction: 'reply',
      explanation: 'Публичное извинение + решение',
    })
  }

  if (comment.isLead) {
    suggestions.push({
      text: `Рады, что вас это интересует! Напишите в личные сообщения — обсудим детали.`,
      tone: 'friendly',
      riskScore: 5,
      suggestedAction: 'move_to_dm',
      explanation: 'Перевод потенциального клиента в DM',
    })
  }

  if (analysis.intent === 'discussion') {
    suggestions.push({
      text: `Интересная мысль! А как вы считаете, ${comment.text.length > 30 ? 'этот подход работает в вашем случае?' : 'что тут самое важное?'}`,
      tone: 'engaging',
      riskScore: 5,
      suggestedAction: 'reply',
      explanation: 'Продолжение диалога',
    })
  }

  if (analysis.intent === 'spam') {
    suggestions.push({
      text: '',
      tone: 'none',
      riskScore: 90,
      suggestedAction: 'ignore',
      explanation: 'Похоже на спам — игнорируем',
    })
  }

  if (suggestions.length === 0) {
    suggestions.push({
      text: `Спасибо за комментарий, ${comment.authorUsername}!`,
      tone: 'friendly',
      riskScore: 5,
      suggestedAction: 'reply',
      explanation: 'Вежливый ответ на комментарий',
    })
  }

  return suggestions
}

export function detectLeadIntent(text: string): boolean {
  const leadSignals = [
    /\b(цена|стоимость|сколько стоит|купить|заказать|приобрести)\b/i,
    /\b(сотрудничать|партнёрство|работать вместе|демо|консультация)\b/i,
    /\b(хочу|нужна помощь|интересует|подскажите пожалуйста)\b/i,
    /\b(ваш опыт|расскажите|покажите как|научите)\b/i,
  ]

  return leadSignals.some(pattern => pattern.test(text))
}
