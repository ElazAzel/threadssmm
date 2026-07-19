import type { ReactNode } from 'react'

export interface DeviceFrameProps {
  device: 'iphone' | 'android' | 'ipad' | 'macbook' | 'browser'
  children: ReactNode
}

const deviceStyles: Record<string, { width: string; height: string; className: string }> = {
  iphone: {
    width: '390px',
    height: '844px',
    className: 'device-iphone',
  },
  android: {
    width: '412px',
    height: '900px',
    className: 'device-android',
  },
  ipad: {
    width: '1024px',
    height: '1366px',
    className: 'device-ipad',
  },
  macbook: {
    width: '1440px',
    height: '900px',
    className: 'device-macbook',
  },
  browser: {
    width: '100%',
    height: 'auto',
    className: 'device-browser',
  },
}

export function DeviceFrame({ device = 'browser', children }: DeviceFrameProps) {
  const cfg = deviceStyles[device]
  return (
    <div className={`device-frame ${cfg.className}`} style={{ maxWidth: cfg.width }}>
      {device === 'browser' && (
        <div className="browser-chrome">
          <div className="browser-dots">
            <span /><span /><span />
          </div>
          <div className="browser-address" />
        </div>
      )}
      <div className="device-screen" style={{ minHeight: cfg.height }}>
        {children}
      </div>
    </div>
  )
}
