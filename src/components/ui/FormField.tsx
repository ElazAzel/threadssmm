import type { ReactNode } from 'react'

interface FormFieldProps {
  label?: string
  error?: string
  hint?: string
  children: ReactNode
  className?: string
}

export const FormField = ({ label, error, hint, children, className = '' }: FormFieldProps) => (
  <div className={`field ${error ? 'field-error' : ''} ${className}`}>
    {label && <label>{label}</label>}
    {children}
    {hint && !error && <span className="field-hint">{hint}</span>}
    {error && <span className="field-error-text" role="alert">{error}</span>}
  </div>
)
