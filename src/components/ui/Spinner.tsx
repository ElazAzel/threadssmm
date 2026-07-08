interface SpinnerProps {
  size?: number
  className?: string
}

export const Spinner = ({ size = 20, className = '' }: SpinnerProps) => (
  <span
    className={`spinner ${className}`}
    style={{ width: size, height: size }}
    aria-label="Загрузка"
    role="status"
  >
    <svg viewBox="0 0 24 24" fill="none" width={size} height={size}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
      <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  </span>
)
