import { forwardRef, type SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, id, className = '', ...rest }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    const hintId = hint ? `${selectId}-hint` : undefined
    const errorId = error ? `${selectId}-error` : undefined

    return (
      <div className={`field ${error ? 'field-error' : ''} ${className}`}>
        {label && <label htmlFor={selectId}>{label}</label>}
        <select
          ref={ref}
          id={selectId}
          aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
          aria-invalid={error ? true : undefined}
          {...rest}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {hint && !error && <span className="field-hint" id={hintId}>{hint}</span>}
        {error && <span className="field-error-text" id={errorId} role="alert">{error}</span>}
      </div>
    )
  },
)

Select.displayName = 'Select'
