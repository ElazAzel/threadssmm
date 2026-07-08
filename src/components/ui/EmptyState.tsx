import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title?: ReactNode
  text?: ReactNode
  action?: ReactNode
}

export const EmptyState = ({ icon, title, text, action }: EmptyStateProps) => (
  <div className="empty-state" role="status">
    {icon && <div className="empty-state-icon" aria-hidden="true">{icon}</div>}
    {title && <h3 className="empty-state-title">{title}</h3>}
    {text && <p className="empty-state-text">{text}</p>}
    {action && <div className="empty-state-action">{action}</div>}
  </div>
)
