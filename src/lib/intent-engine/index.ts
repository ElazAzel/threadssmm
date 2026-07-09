import { normalizeInput } from './input-normalizer'
import { detectIntent } from './intent-router'
import { extractSlots } from './slot-extractor'
import { evaluateClarification } from './clarification-gate'
import { buildContext } from './context-builder'
import { composeHiddenPrompt, getMatchingPreset } from './prompt-composer'
import { critiqueVariant, generateRepairPrompt } from './critic'
import { getPresetById } from './presets'
import type { PipelineOptions, PipelineResult, VariantWithScore, CriticScore, Intent, IntentResult, SlotResult, ClarificationDecision, ContextResult, PromptPreset } from './types'

export type { Intent, IntentResult, SlotResult, ClarificationDecision, ContextResult, CriticScore, PromptPreset, PipelineResult, VariantWithScore }

export function runPipeline(options: PipelineOptions): PipelineResult {
  const { rawInput, brand, recentPosts } = options

  // Step 1: Normalize
  const normalized = normalizeInput(rawInput)
  const cleaned = normalized.cleaned

  // Step 2: Intent detection
  const intent = detectIntent(rawInput)

  // Step 3: Slot extraction
  const slots = extractSlots(rawInput)

  // Step 4: Clarification gate
  const clarification = evaluateClarification({
    topic: slots.topic,
    format: slots.format,
    tone: slots.tone,
    audience: slots.audience,
    goal: slots.goal,
    brand,
  })

  // Step 5: Context building
  const context = buildContext({ brand, recentPosts })

  // Step 6: Preset matching
  const preset = getMatchingPreset(slots, rawInput)

  // Step 7: Prompt composition
  const hiddenPrompt = composeHiddenPrompt({
    intent,
    slots,
    context,
    presetId: preset?.id,
  })

  return {
    original: rawInput,
    normalized: cleaned,
    intent,
    slots,
    clarification,
    context,
    hiddenPrompt,
  }
}

export function scoreVariants(
  variants: Array<{ id: string; text: string; tone: string; hookScore: number; complianceScore: number; complianceNote: string }>,
  context: PipelineResult['context'],
  slots: PipelineResult['slots'],
): VariantWithScore[] {
  return variants.map((v) => ({
    ...v,
    criticScore: critiqueVariant(v.text, context, slots),
  }))
}

export function getBestVariant(variants: VariantWithScore[]): VariantWithScore | null {
  if (!variants.length) return null
  return variants.reduce((best, v) => {
    const score = v.criticScore?.overall ?? v.hookScore
    const bestScore = best.criticScore?.overall ?? best.hookScore
    return score > bestScore ? v : best
  })
}

export function getRepairPrompts(variants: VariantWithScore[]): string[] {
  return variants
    .filter((v) => v.criticScore && v.criticScore.overall < 7)
    .map((v) => generateRepairPrompt(v.text, v.criticScore!))
}

export {
  normalizeInput,
  detectIntent,
  extractSlots,
  evaluateClarification,
  buildContext,
  composeHiddenPrompt,
  critiqueVariant,
  generateRepairPrompt,
  getPresetById,
}

export { PRESETS } from './presets'
export { FORBIDDEN_PHRASES } from './types'
