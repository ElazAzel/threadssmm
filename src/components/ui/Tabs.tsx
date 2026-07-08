import { useState, type ReactNode } from 'react'

interface Tab {
  id: string
  label: string
  content: ReactNode
}

interface TabsProps {
  tabs: Tab[]
  defaultTab?: string
  className?: string
}

export const Tabs = ({ tabs, defaultTab, className = '' }: TabsProps) => {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id)

  if (!tabs.length) return null

  return (
    <div className={`tabs ${className}`}>
      <div className="tabs-list" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${active === tab.id ? 'tab-active' : ''}`}
            role="tab"
            aria-selected={active === tab.id}
            onClick={() => setActive(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className="tab-panel"
          role="tabpanel"
          aria-hidden={active !== tab.id}
          hidden={active !== tab.id}
        >
          {tab.content}
        </div>
      ))}
    </div>
  )
}
