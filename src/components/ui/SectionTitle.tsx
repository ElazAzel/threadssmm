import type { ReactNode } from 'react'

interface SectionTitleProps {
  icon?: ReactNode
  title: ReactNode
  action?: ReactNode
}

export const SectionTitle = ({ icon, title, action }: SectionTitleProps) => (
  <div className="section-title">
    <h2>
      {icon && <span className="section-title-icon">{icon}</span>}
      {title}
    </h2>
    {action && <div className="section-title-action">{action}</div>}
  </div>
)
