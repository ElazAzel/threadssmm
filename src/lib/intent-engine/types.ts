import type { Brand, ContentFormat } from '../domain'

export type Intent =
  | 'generate_post'
  | 'rewrite_post'
  | 'create_content_plan'
  | 'analyze_rss'
  | 'create_thread'
  | 'create_reply'
  | 'reply_comment'
  | 'schedule_post'
  | 'approve_draft'
  | 'unknown'

export interface IntentResult {
  intent: Intent
  confidence: number
}

export interface SlotResult {
  topic: string | null
  format: ContentFormat
  tone: string | null
  audience: string | null
  goal: string | null
  cta: string | null
  length: string | null
  language: string
  platform: string
}

export interface ClarificationDecision {
  needClarification: boolean
  questions: string[]
  autoAssumptions: Partial<SlotResult>
}

export interface ContextResult {
  brandName: string
  brandVoice: string
  platformRules: string
  offer: string
  audience: string
  positioning: string
  usp: string
  contentPillars: string[]
  ctas: string[]
  forbiddenTopics: string[]
  forbiddenPhrases: string[]
  goodExamples: string
  badExamples: string
  recentPosts: string
}

export interface CriticScore {
  hookStrength: number
  clarity: number
  humanTone: number
  brandFit: number
  ctaQuality: number
  threadsFit: number
  overall: number
  issues: string[]
}

export interface PromptPreset {
  id: string
  label: string
  description: string
  icon: string
  systemPrompt: string
  slotDefaults: Partial<SlotResult>
}

export interface PipelineOptions {
  brand: Brand | null
  recentPosts: string
  rawInput: string
}

export interface PipelineResult {
  original: string
  normalized: string
  intent: IntentResult
  slots: SlotResult
  clarification: ClarificationDecision
  context: ContextResult
  hiddenPrompt: string
  variants?: VariantWithScore[]
}

export interface VariantWithScore {
  id: string
  tone: string
  text: string
  hookScore: number
  complianceScore: number
  complianceNote: string
  criticScore?: CriticScore
}

export const INTENT_LABELS: Record<Intent, string> = {
  generate_post: 'Создать пост',
  rewrite_post: 'Переписать пост',
  create_content_plan: 'Создать контент-план',
  analyze_rss: 'Анализ RSS',
  create_thread: 'Создать тред',
  create_reply: 'Создать ответ',
  reply_comment: 'Ответить на комментарий',
  schedule_post: 'Запланировать пост',
  approve_draft: 'Согласовать черновик',
  unknown: 'Не определено',
}

export const INTENT_ICONS: Record<Intent, string> = {
  generate_post: '✍️',
  rewrite_post: '🔄',
  create_content_plan: '📅',
  analyze_rss: '📡',
  create_thread: '🧵',
  create_reply: '💬',
  reply_comment: '↩️',
  schedule_post: '⏰',
  approve_draft: '✅',
  unknown: '❓',
}

export const FORBIDDEN_PHRASES = [
  'в современном мире',
  'инновационные решения',
  'уникальная возможность',
  'цифровая трансформация',
  'шаг в будущее',
  'новые горизонты',
  ' cutting-edge',
  'state-of-the-art',
  'best-in-class',
  'революционный подход',
  'искусственный интеллект (ИИ)',
  'стремительное развитие',
  'решение всех проблем',
]
