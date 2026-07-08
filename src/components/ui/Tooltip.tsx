import type { ReactNode } from 'react'

interface TooltipProps {
  content: string
  children: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export const Tooltip = ({ content, children, position = 'top' }: TooltipProps) => (
  <div className="tooltip-wrapper" tabIndex={0}>
    {children}
    <span className={`tooltip tooltip-${position}`} role="tooltip">
      {content}
    </span>
  </div>
)
