import type { ReactNode, HTMLAttributes } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'accent' | 'success' | 'warn' | 'danger' | 'info'
  tone?: string
  dot?: boolean
  children?: ReactNode
}

const toneMap: Record<string, string> = {
  neutral: 'badge-default',
  blue: 'badge-accent',
  green: 'badge-success',
  orange: 'badge-warn',
  red: 'badge-danger',
  violet: 'badge-accent',
}

const variantClass: Record<string, string> = {
  default: 'badge-default',
  accent: 'badge-accent',
  success: 'badge-success',
  warn: 'badge-warn',
  danger: 'badge-danger',
  info: 'badge-info',
}

export const Badge = ({
  variant = 'default',
  tone,
  dot,
  children,
  className = '',
  ...rest
}: BadgeProps) => {
  const resolved = tone ? toneMap[tone] ?? variantClass.default : variantClass[variant] ?? variantClass.default
  return (
    <span className={`badge ${resolved} ${className}`} {...rest}>
      {dot && <span className="badge-dot" aria-hidden="true" />}
      {children}
    </span>
  )
}
