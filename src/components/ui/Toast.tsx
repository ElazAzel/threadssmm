import { useEffect, type ReactNode } from 'react'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info' | 'warn'
  onClose: () => void
  duration?: number
  icon?: ReactNode
}

export const Toast = ({ message, type = 'info', onClose, duration = 4000, icon }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [onClose, duration])

  return (
    <div
      className={`toast toast-${type}`}
      role="status"
      aria-live="polite"
    >
      {icon && <span className="toast-icon" aria-hidden="true">{icon}</span>}
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={onClose} aria-label="Закрыть">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
