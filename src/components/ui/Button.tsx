import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'brand'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: ReactNode
}

const variantClass: Record<string, string> = {
  primary: 'button-primary',
  secondary: 'button-secondary',
  ghost: 'button-ghost',
  danger: 'button-danger',
  brand: 'button-brand',
}

const sizeClass: Record<string, string> = {
  sm: 'button-sm',
  md: 'button-md',
  lg: 'button-lg',
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  loading,
  icon,
  children,
  className = '',
  disabled,
  ...rest
}: ButtonProps) => (
  <button
    className={`button ${variantClass[variant] ?? variantClass.primary} ${sizeClass[size] ?? sizeClass.md} ${className}`}
    disabled={disabled || loading}
    {...rest}
  >
    {loading && <span className="spinner-button" aria-hidden="true" />}
    {!loading && icon && <span className="button-icon" aria-hidden="true">{icon}</span>}
    {children && <span className="button-label">{children}</span>}
  </button>
)
