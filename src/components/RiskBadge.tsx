import { AlertTriangle, ShieldCheck, ShieldAlert, ShieldBan, ShieldHalf } from 'lucide-react'


interface RiskBadgeProps {
  score: number
  verdict?: string
  warnings?: string[]
  compact?: boolean
}

export function RiskBadge({ score, verdict: _verdict, warnings, compact }: RiskBadgeProps) {
  const getColor = () => {
    if (score <= 20) return 'var(--success)'
    if (score <= 40) return 'var(--warn)'
    if (score <= 60) return '#f59e0b'
    if (score <= 80) return 'var(--danger)'
    return '#dc2626'
  }

  const getIcon = () => {
    if (score <= 20) return <ShieldCheck size={compact ? 12 : 16} />
    if (score <= 40) return <ShieldHalf size={compact ? 12 : 16} />
    if (score <= 60) return <AlertTriangle size={compact ? 12 : 16} />
    if (score <= 80) return <ShieldAlert size={compact ? 12 : 16} />
    return <ShieldBan size={compact ? 12 : 16} />
  }

  const getLabel = () => {
    if (score <= 20) return 'Безопасно'
    if (score <= 40) return 'Низкий риск'
    if (score <= 60) return 'Требует проверки'
    if (score <= 80) return 'Высокий риск'
    return 'Заблокировано'
  }

  return (
    <div className={`risk-badge ${compact ? 'compact' : ''}`} style={{
      '--risk-color': getColor(),
      borderColor: getColor(),
      background: `color-mix(in srgb, ${getColor()}, transparent 88%)`,
    } as React.CSSProperties}>
      {getIcon()}
      <span>{getLabel()} — {score}%</span>
      {!compact && warnings && warnings.length > 0 && (
        <div className="risk-warnings">
          {warnings.slice(0, 2).map((w, i) => (
            <small key={i}>{w}</small>
          ))}
        </div>
      )}
    </div>
  )
}
