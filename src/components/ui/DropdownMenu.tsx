import { useState, useRef, useEffect, type ReactNode } from 'react'

interface DropdownMenuProps {
  trigger: ReactNode
  children: ReactNode
  align?: 'start' | 'end'
}

export const DropdownMenu = ({ trigger, children, align = 'start' }: DropdownMenuProps) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className="dropdown" ref={ref}>
      <button
        className="dropdown-trigger"
        onClick={() => setOpen(!open)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {trigger}
      </button>
      {open && (
        <div className={`dropdown-menu dropdown-menu-${align}`} role="menu">
          {children}
        </div>
      )}
    </div>
  )
}

interface DropdownItemProps {
  onClick?: () => void
  children: ReactNode
  danger?: boolean
}

export const DropdownItem = ({ onClick, children, danger }: DropdownItemProps) => (
  <button
    className={`dropdown-item ${danger ? 'dropdown-item-danger' : ''}`}
    onClick={onClick}
    role="menuitem"
  >
    {children}
  </button>
)
