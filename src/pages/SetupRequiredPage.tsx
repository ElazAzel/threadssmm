import { Link } from 'react-router-dom'
import { Database, Sparkles } from 'lucide-react'
import { Card } from '../components/ui'

export function SetupRequiredPage() {
  return (
    <div className="auth-page setup-page">
      <Link to="/" className="landing-logo"><Sparkles size={20} /> Threads SMM Agent</Link>
      <Card className="auth-card setup-card">
        <span className="auth-icon"><Database /></span>
        <h1>Требуется подключить Supabase</h1>
        <p>Frontend уже опубликован, но рабочая база и авторизация ещё не настроены.</p>
        <ol>
          <li>Создайте бесплатный проект на Supabase.</li>
          <li>Примените SQL из <code>supabase/migrations</code>.</li>
          <li>Добавьте в Vercel <code>VITE_SUPABASE_URL</code> и <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>.</li>
          <li>Добавьте серверные переменные из <code>.env.example</code>.</li>
        </ol>
        <p className="setup-note">Secret key нельзя размещать в переменной с префиксом <code>VITE_</code>.</p>
      </Card>
    </div>
  )
}
