import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className = '', ...rest }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    const hintId = hint ? `${inputId}-hint` : undefined
    const errorId = error ? `${inputId}-error` : undefined

    return (
      <div className={`field ${error ? 'field-error' : ''} ${className}`}>
        {label && <label htmlFor={inputId}>{label}</label>}
        <input
          ref={ref}
          id={inputId}
          aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
          aria-invalid={error ? true : undefined}
          {...rest}
        />
        {hint && !error && <span className="field-hint" id={hintId}>{hint}</span>}
        {error && <span className="field-error-text" id={errorId} role="alert">{error}</span>}
      </div>
    )
  },
)

Input.displayName = 'Input'
