import { type InputHTMLAttributes } from 'react'

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
}

export const Switch = ({ label, id, className = '', ...rest }: SwitchProps) => {
  const switchId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <label className={`switch ${className}`}>
      <input type="checkbox" id={switchId} className="switch-input" role="switch" {...rest} />
      <span className="switch-track" aria-hidden="true">
        <span className="switch-thumb" />
      </span>
      {label && <span className="switch-label">{label}</span>}
    </label>
  )
}
