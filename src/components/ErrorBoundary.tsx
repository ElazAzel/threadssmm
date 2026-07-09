import { Component, type ErrorInfo, type ReactNode } from 'react'

const dsn = import.meta.env.VITE_SENTRY_DSN

function sendToSentry(error: Error, info: ErrorInfo) {
  if (!dsn) return
  try {
    const body = {
      exception: { values: [{ type: error.name, value: error.message, stacktrace: { frames: (error.stack ?? '').split('\n').slice(1, 11).map((line) => ({ filename: line })) } }] },
      extra: { componentStack: info.componentStack },
      timestamp: new Date().toISOString(),
    }
    fetch(`${dsn}/envelope/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => {})
    } catch {
      // Silently ignore — Sentry delivery failure should not crash the app
    }
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    sendToSentry(error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        textAlign: 'center',
        background: '#0d0d0d',
        color: '#e0e0e0',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠</div>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#fff' }}>Что-то пошло не так</h1>
        <p style={{ color: '#888', maxWidth: 400, marginBottom: '1.5rem' }}>
          Произошла непредвиденная ошибка. Наша команда уже уведомлена.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          Обновить страницу
        </button>
        {process.env.NODE_ENV === 'development' && this.state.error && (
          <pre style={{ marginTop: '2rem', padding: '1rem', background: '#1a1a1a', borderRadius: 8, fontSize: '0.8rem', maxWidth: '100%', overflow: 'auto', textAlign: 'left' }}>
            {this.state.error.message}
            {this.state.error.stack}
          </pre>
        )}
      </div>
    )
  }
}