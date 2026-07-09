import type { Brand } from '../domain'
import type { ClarificationDecision, SlotResult } from './types'

export interface ClarificationInput {
  topic: string | null
  format: string
  tone: string | null
  audience: string | null
  goal: string | null
  brand: Brand | null
}

const CRITICAL_QUESTIONS: Array<{ check: (input: ClarificationInput) => boolean; question: string }> = [
  {
    check: (i) => !i.topic && !i.brand?.description?.trim(),
    question: 'О чём будет пост? Опишите тему или идею.',
  },
]

const NICE_TO_HAVE_QUESTIONS: Array<{ check: (input: ClarificationInput) => boolean; question: string }> = [
  {
    check: (i) => !i.goal && !i.brand?.goals?.length,
    question: 'Какая цель публикации: получить заявки, повысить вовлечённость или укрепить экспертность?',
  },
  {
    check: (i) => !i.tone && !i.brand?.tone_of_voice?.trim(),
    question: 'Какой тон использовать: экспертный, живой, продающий или в стиле бренда?',
  },
  {
    check: (i) => !i.audience && !i.brand?.audience?.trim(),
    question: 'На какую аудиторию ориентируемся?',
  },
]

export function evaluateClarification(input: ClarificationInput): ClarificationDecision {
  const questions: string[] = []

  for (const { check, question } of CRITICAL_QUESTIONS) {
    if (check(input)) questions.push(question)
  }

  if (!questions.length) {
    for (const { check, question } of NICE_TO_HAVE_QUESTIONS) {
      if (check(input)) questions.push(question)
    }
  }

  const autoAssumptions: Partial<SlotResult> = {}

  if (!input.tone && input.brand?.tone_of_voice?.trim()) {
    autoAssumptions.tone = input.brand.tone_of_voice
  }
  if (!input.audience && input.brand?.audience?.trim()) {
    autoAssumptions.audience = input.brand.audience
  }
  if (!input.goal && input.brand?.goals?.length) {
    autoAssumptions.goal = input.brand.goals[0]
  }

  return {
    needClarification: questions.length > 0,
    questions,
    autoAssumptions,
  }
}
