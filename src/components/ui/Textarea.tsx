import { forwardRef, type TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, id, className = '', ...rest }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    const hintId = hint ? `${textareaId}-hint` : undefined
    const errorId = error ? `${textareaId}-error` : undefined

    return (
      <div className={`field ${error ? 'field-error' : ''} ${className}`}>
        {label && <label htmlFor={textareaId}>{label}</label>}
        <textarea
          ref={ref}
          id={textareaId}
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

Textarea.displayName = 'Textarea'
