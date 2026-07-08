interface ProgressProps {
  value: number
  tone?: 'blue' | 'green' | 'orange' | 'violet'
}

const toneClass: Record<string, string> = {
  blue: 'progress-blue',
  green: 'progress-green',
  orange: 'progress-orange',
  violet: 'progress-violet',
}

export const Progress = ({ value, tone = 'blue' }: ProgressProps) => (
  <div className="progress" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
    <span
      className={`progress-bar ${toneClass[tone] ?? toneClass.blue}`}
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
)
