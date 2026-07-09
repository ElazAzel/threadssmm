export interface NormalizedInput {
  original: string
  cleaned: string
  language: 'ru' | 'en' | 'mixed'
}

export function normalizeInput(raw: string): NormalizedInput {
  const original = raw.trim()
  let cleaned = original

  // Remove excessive whitespace
  cleaned = cleaned.replace(/\s+/g, ' ')

  // Remove leading/trailing punctuation
  cleaned = cleaned.replace(/^[,.\s!?]+|[,.\s!?]+$/g, '')

  // Normalize quotes
  cleaned = cleaned.replace(/[''""]/g, '"')

  // Capitalize first letter
  cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1)

  // Detect language
  const ruChars = (cleaned.match(/[а-яё]/gi) || []).length
  const enChars = (cleaned.match(/[a-z]/gi) || []).length
  const language = ruChars > enChars ? 'ru' : enChars > ruChars ? 'en' : 'mixed'

  // Add trailing period if missing and looks like a sentence
  if (language === 'ru' && !/[.!?]/.test(cleaned.charAt(cleaned.length - 1))) {
    cleaned += '.'
  }

  return { original, cleaned, language }
}
