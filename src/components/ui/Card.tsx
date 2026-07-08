import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
}

interface CardHeaderProps {
  title: ReactNode
  action?: ReactNode
  className?: string
}

interface CardBodyProps {
  children?: ReactNode
  className?: string
}

interface CardFooterProps {
  children?: ReactNode
  className?: string
}

export const Card = ({ hoverable, children, className = '', ...rest }: CardProps) => (
  <div className={`card ${hoverable ? 'card-hoverable' : ''} ${className}`} {...rest}>
    {children}
  </div>
)

Card.Header = ({ title, action, className = '' }: CardHeaderProps) => (
  <div className={`card-header ${className}`}>
    <h3 className="card-title">{title}</h3>
    {action && <div className="card-action">{action}</div>}
  </div>
)

Card.Body = ({ children, className = '' }: CardBodyProps) => (
  <div className={`card-body ${className}`}>{children}</div>
)

Card.Footer = ({ children, className = '' }: CardFooterProps) => (
  <div className={`card-footer ${className}`}>{children}</div>
)
