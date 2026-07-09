import { useState, useMemo } from 'react'
import { Sparkles, ChevronRight, Zap, AlertCircle, Lightbulb } from 'lucide-react'
import { Button, Badge, Modal } from './ui'
import { PRESETS } from '../lib/intent-engine'
import { runPipeline, type PipelineResult } from '../lib/intent-engine'
import { useWorkspace } from '../contexts/WorkspaceContext'

interface IntentInputProps {
  initialPrompt?: string
  onPromptReady: (prompt: string) => void
  onPipelineResult?: (result: PipelineResult) => void
  openPresetModal?: boolean
  onClosePresetModal?: () => void
}

export function IntentInput({
  initialPrompt = '',
  onPromptReady,
  onPipelineResult,
  openPresetModal,
  onClosePresetModal,
}: IntentInputProps) {
  const { brands } = useWorkspace()
  const brand = brands[0] ?? null

  const [raw, setRaw] = useState(initialPrompt)
  const [showPipeline, setShowPipeline] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)

  const result = useMemo(() => {
    if (!raw.trim()) return null
    try {
      return runPipeline({ rawInput: raw, brand, recentPosts: '' })
    } catch {
      return null
    }
  }, [raw, brand])

  const handleGenerate = () => {
    if (!raw.trim()) return
    const result = runPipeline({ rawInput: raw, brand, recentPosts: '' })
    onPipelineResult?.(result)
    onPromptReady(result.hiddenPrompt)
  }

  const applyPreset = (presetId: string) => {
    const preset = PRESETS.find((p) => p.id === presetId)
    if (!preset) return
    setSelectedPreset(presetId)
    setShowPipeline(true)
    const enhanced = `${raw ? raw + ' ' : ''}${preset.description}`
    const result = runPipeline({ rawInput: enhanced, brand, recentPosts: '' })
    onPipelineResult?.(result)
  }

  const clarityIssues = result?.clarification.needClarification ? result.clarification.questions : null
  const detectedIntent = result?.intent ?? null

  return (
    <div className="intent-input">
      {/* Quick presets */}
      <div className="preset-strip">
        {PRESETS.slice(0, 5).map((preset) => (
          <button
            key={preset.id}
            className={`preset-chip ${selectedPreset === preset.id ? 'active' : ''}`}
            onClick={() => applyPreset(preset.id)}
            title={preset.description}
          >
            <span>{preset.icon}</span>
            <span>{preset.label}</span>
          </button>
        ))}
      </div>

      <div className="mobile-preset-scroll">
        {PRESETS.slice(0, 4).map((preset) => (
          <button
            key={preset.id}
            className={`preset-chip ${selectedPreset === preset.id ? 'active' : ''}`}
            onClick={() => applyPreset(preset.id)}
          >
            <span>{preset.icon}</span>
            <span>{preset.label}</span>
          </button>
        ))}
      </div>

      {/* Intent badge */}
      {detectedIntent && detectedIntent.intent !== 'unknown' && (
        <div className="intent-badge">
          <Zap size={14} />
          <span>{detectedIntent.intent === 'generate_post' ? 'Создание поста' :
            detectedIntent.intent === 'create_thread' ? 'Создание треда' :
            detectedIntent.intent === 'rewrite_post' ? 'Переписывание' :
            detectedIntent.intent === 'create_content_plan' ? 'Контент-план' :
            detectedIntent.intent === 'create_reply' ? 'Создание ответа' :
            detectedIntent.intent === 'analyze_rss' ? 'Анализ RSS' : 'Задача'}
          </span>
          <span className="confidence">{Math.round(detectedIntent.confidence * 100)}%</span>
        </div>
      )}

      {/* Input area */}
      <div className="input-area">
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder="Напишите, что нужно сделать… Например: «сделай пост про AI-аудит для предпринимателей»"
          rows={3}
        />
      </div>

      {/* Clarification hints */}
      {clarityIssues && clarityIssues.length > 0 && raw.trim().length > 5 && (
        <div className="clarity-hints">
          <AlertCircle size={14} />
          <span>{clarityIssues[0]}</span>
        </div>
      )}

      {/* Slot summary (collapsible) */}
      {result && raw.trim().length > 5 && (
        <div className="slot-summary">
          {result.slots.topic && (
            <span className="slot-tag">
              <Lightbulb size={12} />
              {result.slots.topic.slice(0, 50)}
            </span>
          )}
          <span className="slot-tag">{result.slots.format === 'post' ? 'Пост' : result.slots.format === 'thread' ? 'Тред' : 'Ответ'}</span>
          {result.slots.tone && <span className="slot-tag">{result.slots.tone}</span>}
          {result.slots.goal && <span className="slot-tag">{result.slots.goal}</span>}
        </div>
      )}

      {/* Actions */}
      <div className="input-actions">
        <Button
          onClick={handleGenerate}
          disabled={!raw.trim() || raw.trim().length < 3}
        >
          <Sparkles size={16} />
          Сгенерировать
        </Button>
        <button
          className="pipeline-toggle"
          onClick={() => setShowPipeline(!showPipeline)}
        >
          {showPipeline ? 'Скрыть' : 'Показать'} промпт
          <ChevronRight size={14} className={showPipeline ? 'rotated' : ''} />
        </button>
      </div>

      {/* Hidden prompt preview */}
      {showPipeline && result && (
        <div className="hidden-prompt-preview">
          <div className="preview-header">
            <strong>Сформированный промпт для AI</strong>
            <Badge>Скрытый слой</Badge>
          </div>
          <pre>{result.hiddenPrompt}</pre>
        </div>
      )}

      {/* Preset grid modal */}
      {openPresetModal && onClosePresetModal && (
        <Modal title="Что будем создавать?" onClose={onClosePresetModal}>
          <div className="preset-grid-modal">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                className="preset-card-modal"
                onClick={() => { applyPreset(preset.id); onClosePresetModal() }}
              >
                <span className="preset-icon">{preset.icon}</span>
                <strong>{preset.label}</strong>
                <small>{preset.description}</small>
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  )
}

export function PresetSelector({ onSelect }: { onSelect: (presetId: string) => void }) {
  return (
    <div className="preset-grid">
      {PRESETS.map((preset) => (
        <button
          key={preset.id}
          className="preset-card"
          onClick={() => onSelect(preset.id)}
        >
          <span className="preset-icon">{preset.icon}</span>
          <strong>{preset.label}</strong>
          <small>{preset.description}</small>
        </button>
      ))}
    </div>
  )
}
