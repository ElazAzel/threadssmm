export const BRAND_VOICE_TRAITS = {
  pointOfView: {
    options: [
      { value: 'first_person', label: 'От первого лица (я/мы)' },
      { value: 'third_person', label: 'От третьего лица (компания/бренд)' },
      { value: 'impersonal', label: 'Безличная (экспертная)' },
    ],
  },
  formality: {
    options: [
      { value: 'formal', label: 'Официальный' },
      { value: 'semi_formal', label: 'Полуофициальный' },
      { value: 'casual', label: 'Непринуждённый' },
    ],
  },
  energy: {
    options: [
      { value: 'calm', label: 'Спокойный' },
      { value: 'professional', label: 'Деловой' },
      { value: 'enthusiastic', label: 'Энергичный' },
      { value: 'bold', label: 'Дерзкий' },
    ],
  },
  humor: {
    options: [
      { value: 'none', label: 'Без юмора' },
      { value: 'subtle', label: 'Лёгкая ирония' },
      { value: 'friendly', label: 'Дружелюбный' },
      { value: 'playful', label: 'Игривый' },
    ],
  },
  attitude: {
    options: [
      { value: 'mentor', label: 'Наставнический' },
      { value: 'peer', label: 'Равный партнёр' },
      { value: 'expert', label: 'Экспертный' },
      { value: 'friend', label: 'Дружеский' },
    ],
  },
  warmth: {
    options: [
      { value: 'warm', label: 'Тёплый' },
      { value: 'neutral', label: 'Нейтральный' },
      { value: 'direct', label: 'Прямой' },
    ],
  },
  styleTraits: {
    multiple: true,
    options: [
      { value: 'metaphors', label: 'Метафоры' },
      { value: 'storytelling', label: 'Сторителлинг' },
      { value: 'data_driven', label: 'Опора на данные' },
      { value: 'short_sentences', label: 'Короткие предложения' },
      { value: 'questions', label: 'Вопросы аудитории' },
      { value: 'lists', label: 'Списки' },
      { value: 'quotes', label: 'Цитаты' },
      { value: 'examples', label: 'Примеры из жизни' },
    ],
  },
} as const

export type BrandVoiceTrait = keyof typeof BRAND_VOICE_TRAITS

export interface BrandVoiceArchetype {
  id: string
  label: string
  description: string
  traits: string[]
}

export const BRAND_ARCHETYPES: BrandVoiceArchetype[] = [
  { id: 'creator', label: 'Творец', description: 'Инновационный, вдохновляющий, визионерский', traits: ['bold', 'enthusiastic', 'storytelling'] },
  { id: 'caregiver', label: 'Заботливый', description: 'Поддерживающий, тёплый, эмпатичный', traits: ['warm', 'friendly', 'examples'] },
  { id: 'ruler', label: 'Правитель', description: 'Уверенный, авторитетный, статусный', traits: ['formal', 'professional', 'data_driven'] },
  { id: 'jester', label: 'Шут', description: 'Игривый, остроумный, неожиданный', traits: ['playful', 'casual', 'metaphors'] },
  { id: 'sage', label: 'Мудрец', description: 'Экспертный, глубокий, обучающий', traits: ['expert', 'calm', 'data_driven'] },
  { id: 'hero', label: 'Герой', description: 'Смелый, решительный, вдохновляющий', traits: ['bold', 'enthusiastic', 'short_sentences'] },
  { id: 'outlaw', label: 'Бунтарь', description: 'Дерзкий, нестандартный, провокационный', traits: ['bold', 'casual', 'questions'] },
  { id: 'magician', label: 'Маг', description: 'Трансформационный, загадочный, visionary', traits: ['enthusiastic', 'metaphors', 'storytelling'] },
  { id: 'regular_guy', label: 'Свой парень', description: 'Дружеский, простой, близкий к аудитории', traits: ['casual', 'friendly', 'short_sentences'] },
  { id: 'lover', label: 'Любовник', description: 'Чувственный, страстный, эмоциональный', traits: ['warm', 'enthusiastic', 'metaphors'] },
  { id: 'explorer', label: 'Исследователь', description: 'Любопытный, свободный, первооткрыватель', traits: ['enthusiastic', 'questions', 'examples'] },
  { id: 'innocent', label: 'Невинный', description: 'Оптимистичный, простой, искренний', traits: ['warm', 'friendly', 'short_sentences'] },
]

export interface BrandVoiceSelection {
  pointOfView: string
  formality: string
  energy: string
  humor: string
  attitude: string
  warmth: string
  styleTraits: string[]
  // Extended fields
  ctaStyle: 'none' | 'soft' | 'direct' | 'question'
  humorStyle: 'none' | 'subtle' | 'friendly' | 'playful' | 'sarcastic'
  boldnessLevel: number
  formalityLevel: number
  lovedWords: string[]
  hatedWords: string[]
  brandArchetype: string
  replyStyleGuide: string
}

export function formatBrandVoicePrompt(voice: Partial<BrandVoiceSelection>): string {
  const parts: string[] = []

  if (voice.pointOfView) {
    const label = BRAND_VOICE_TRAITS.pointOfView.options.find(o => o.value === voice.pointOfView)?.label
    if (label) parts.push(`Точка зрения: ${label}`)
  }
  if (voice.formality) {
    const label = BRAND_VOICE_TRAITS.formality.options.find(o => o.value === voice.formality)?.label
    if (label) parts.push(`Формальность: ${label}`)
  }
  if (voice.energy) {
    const label = BRAND_VOICE_TRAITS.energy.options.find(o => o.value === voice.energy)?.label
    if (label) parts.push(`Энергия: ${label}`)
  }
  if (voice.humor) {
    const label = BRAND_VOICE_TRAITS.humor.options.find(o => o.value === voice.humor)?.label
    if (label) parts.push(`Юмор: ${label}`)
  }
  if (voice.attitude) {
    const label = BRAND_VOICE_TRAITS.attitude.options.find(o => o.value === voice.attitude)?.label
    if (label) parts.push(`Отношение к аудитории: ${label}`)
  }
  if (voice.warmth) {
    const label = BRAND_VOICE_TRAITS.warmth.options.find(o => o.value === voice.warmth)?.label
    if (label) parts.push(`Теплота: ${label}`)
  }
  if (voice.styleTraits && voice.styleTraits.length > 0) {
    const labels = voice.styleTraits
      .map(v => BRAND_VOICE_TRAITS.styleTraits.options.find(o => o.value === v)?.label)
      .filter(Boolean)
    if (labels.length > 0) parts.push(`Стиль: ${labels.join(', ')}`)
  }
  if (voice.brandArchetype) {
    const archetype = BRAND_ARCHETYPES.find(a => a.id === voice.brandArchetype)
    if (archetype) parts.push(`Архетип бренда: ${archetype.label} — ${archetype.description}`)
  }
  if (voice.lovedWords && voice.lovedWords.length > 0) {
    parts.push(`Любимые слова: ${voice.lovedWords.join(', ')}`)
  }
  if (voice.hatedWords && voice.hatedWords.length > 0) {
    parts.push(`Избегать слов: ${voice.hatedWords.join(', ')}`)
  }
  if (voice.ctaStyle) {
    const ctaLabels: Record<string, string> = { none: 'Без CTA', soft: 'Мягкий', direct: 'Прямой', question: 'Вопрос' }
    parts.push(`Стиль CTA: ${ctaLabels[voice.ctaStyle]}`)
  }

  return parts.length > 0 ? parts.join('. ') : 'Стандартный профессиональный тон'
}

export function getRecommendedArchetype(niche: string): string {
  const map: Record<string, string[]> = {
    'it': ['sage', 'hero', 'regular_guy'],
    'finance': ['ruler', 'sage', 'caregiver'],
    'education': ['sage', 'caregiver', 'innocent'],
    'health': ['caregiver', 'sage', 'hero'],
    'entertainment': ['jester', 'creator', 'lover'],
    'ecommerce': ['regular_guy', 'hero', 'magician'],
    'agency': ['creator', 'sage', 'hero'],
    'saas': ['hero', 'sage', 'explorer'],
    'consulting': ['ruler', 'sage', 'magician'],
    'creative': ['creator', 'explorer', 'lover'],
  }

  const lower = niche.toLowerCase()
  for (const [key, archetypes] of Object.entries(map)) {
    if (lower.includes(key)) return archetypes[0]
  }

  return 'regular_guy'
}

export function voiceToBrandPrompt(brand: {
  name?: string
  description?: string
  tone_of_voice?: string
  positioning?: string
  content_pillars?: string[]
  ctas?: string[]
  risk_tolerance?: number
  loved_words?: string[]
  hated_words?: string[]
  cta_style?: string
  humor_style?: string
  boldness_level?: number
  formality_level?: string
  brand_archetype?: string
  reply_style_guide?: string
  good_examples?: string
  bad_examples?: string
}): string {
  const parts: string[] = []

  if (brand.name) parts.push(`Бренд: ${brand.name}`)
  if (brand.description) parts.push(`Описание: ${brand.description}`)
  if (brand.tone_of_voice) parts.push(`Голос бренда: ${brand.tone_of_voice}`)
  if (brand.positioning) parts.push(`Позиционирование: ${brand.positioning}`)
  if (brand.content_pillars && brand.content_pillars.length > 0) parts.push(`Контент-пиллары: ${brand.content_pillars.join(', ')}`)
  if (brand.ctas && brand.ctas.length > 0) parts.push(`Типичные CTA: ${brand.ctas.join(', ')}`)

  const styleHints: string[] = []
  if (brand.boldness_level !== undefined) styleHints.push(`дерзость ${brand.boldness_level}/100`)
  if (brand.formality_level !== undefined) styleHints.push(`формальность ${brand.formality_level}/100`)
  if (brand.humor_style && brand.humor_style !== 'none') styleHints.push(`юмор: ${brand.humor_style}`)
  if (brand.cta_style) styleHints.push(`CTA: ${brand.cta_style}`)
  if (styleHints.length > 0) parts.push(`Стиль: ${styleHints.join(', ')}`)

  if (brand.loved_words && brand.loved_words.length > 0) parts.push(`Любимые слова: ${brand.loved_words.join(', ')}`)
  if (brand.hated_words && brand.hated_words.length > 0) parts.push(`Избегать: ${brand.hated_words.join(', ')}`)
  if (brand.brand_archetype) {
    const arch = BRAND_ARCHETYPES.find(a => a.id === brand.brand_archetype)
    if (arch) parts.push(`Архетип: ${arch.label}`)
  }
  if (brand.reply_style_guide) parts.push(`Стиль ответов: ${brand.reply_style_guide}`)
  if (brand.good_examples) parts.push(`Хорошие примеры: ${brand.good_examples.slice(0, 300)}`)
  if (brand.bad_examples) parts.push(`Плохие примеры: ${brand.bad_examples.slice(0, 300)}`)

  return parts.join('\n')
}
