import { useState, type FormEvent } from 'react'
import { Navigate, Link, useLocation, useNavigate } from 'react-router-dom'
import { LockKeyhole, Sparkles } from 'lucide-react'
import { Button, Card } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'

export function LoginPage() {
  const { user, signIn, signUp, configured } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  if (!configured) return <Navigate to="/setup" replace />
  if (user) return <Navigate to="/app/dashboard" replace />

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    if (mode === 'signin') {
      const error = await signIn(email, password)
      if (error) setMessage(error.message)
      else navigate((location.state as { from?: string } | null)?.from ?? '/app/dashboard')
    } else {
      const result = await signUp(email, password, fullName)
      if (result.error) setMessage(result.error.message)
      else if (result.needsConfirmation) setMessage('Проверьте почту и подтвердите регистрацию.')
      else navigate('/onboarding')
    }
    setBusy(false)
  }

  return (
    <div className="auth-page">
      <Link to="/" className="landing-logo"><Sparkles size={20} /> Threads SMM Agent</Link>
      <Card className="auth-card">
        <span className="auth-icon"><LockKeyhole /></span>
        <h1>{mode === 'signin' ? 'Вход в workspace' : 'Создание аккаунта'}</h1>
        <p>{mode === 'signin' ? 'Продолжите работу с контентом и согласованиями.' : 'Бесплатный MVP без привязки банковской карты.'}</p>
        <form onSubmit={submit} className="form-stack">
          {mode === 'signup' ? <label>Имя<input value={fullName} onChange={(event) => setFullName(event.target.value)} required autoComplete="name" /></label> : null}
          <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label>
          <label>Пароль<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} /></label>
          {message ? <div className="form-message" role="status">{message}</div> : null}
          <Button type="submit" disabled={busy}>{busy ? 'Подождите...' : mode === 'signin' ? 'Войти' : 'Создать аккаунт'}</Button>
        </form>
        <button className="auth-switch" type="button" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMessage('') }}>
          {mode === 'signin' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
        </button>
      </Card>
    </div>
  )
}
