import { ArrowRight, BarChart3, Bot, CheckSquare, LockKeyhole, Radar, ShieldCheck, Sparkles, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'

const dashboardImage = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCKXdyT8pZYWSEkk1WcakBKch0K5S647jXpouuEeA9oiKCCLlkBVRLF-ZZ5hS41Gg2ZfdfV5wfb78UiH5el8wY-Cyo1Ml4vORnXQf2Gh7pzoSVfxhsPvTvj_xc_UT7hB_008vm61HWquXw9lAxWn-nXAnYUdjoLlZVeHFIipQhJW1tKf_eTyxEeb3Ns5Lvi1csMOw8Wf_O6XjuqCLEU4zb5-XCaVhymopPOTQxVzyTDqFpJHKW0rGJ6EwWhkyvge7o6AG5OBrw7qZg'

const features = [
  { icon: Bot, title: 'AI-планирование контента', text: 'Стратегия и публикации строятся на целях, аудитории, стиле и ограничениях конкретного бренда.' },
  { icon: UsersRound, title: 'Движок голоса бренда', text: 'Агент изучает ваши тексты и поддерживает лексику, ритм, тон и правила коммуникации.' },
  { icon: CheckSquare, title: 'Контур согласования', text: 'AI предлагает, человек проверяет. Ни одна рискованная публикация не уходит без подтверждения.' },
  { icon: Radar, title: 'Мониторинг в реальном времени', text: 'Система находит релевантные темы, упоминания и новости и предлагает безопасный угол реакции.' },
]

export function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <Link to="/" className="landing-logo"><Sparkles size={20} /> Threads SMM Agent</Link>
        <nav><a href="#features">Возможности</a><a href="#pricing">Тарифы</a><a href="#security">Безопасность</a></nav>
        <div><Link className="text-link" to="/login">Войти</Link><Link className="button button-primary" to="/login">Начать</Link></div>
      </header>

      <main>
        <section className="hero">
          <span className="mobile-hero-badge">Новое: Threads API</span>
          <h1>Ваш <span>AI SMM-агент</span> для Threads</h1>
          <p>Планируйте, пишите, согласовывайте и анализируйте контент в единой системе, которая понимает голос бренда и оставляет контроль человеку.</p>
          <div className="hero-actions">
            <Link className="button button-primary" to="/login">Попробовать бесплатно <ArrowRight size={17} /></Link>
            <Link className="button button-secondary" to="/login">Войти в кабинет</Link>
          </div>
          <div className="hero-browser">
            <div className="browser-dots"><i /><i /><i /></div>
            <img src={dashboardImage} alt="Демонстрация панели Threads SMM Agent" />
          </div>
        </section>

        <section id="features" className="landing-section">
          <div className="section-copy"><h2>Управляйте системой, а не хаосом</h2><p>От стратегии и идей до публикации и улучшения на основе данных.</p></div>
          <div className="feature-grid">
            {features.map(({ icon: Icon, title, text }) => <article key={title}><Icon size={23} /><h3>{title}</h3><p>{text}</p></article>)}
          </div>
        </section>

        <section className="mobile-dashboard-preview">
          <div className="mobile-window-bar"><i /><i /><i /></div>
          <div className="mobile-window-content"><span /><span /><span /><Link className="button button-primary" to="/login">Открыть полную панель</Link></div>
        </section>

        <section id="security" className="trust-strip">
          <div><ShieldCheck /><span><strong>Только официальный API</strong>Без скрытой автоматизации</span></div>
          <div><LockKeyhole /><span><strong>Пароли не нужны</strong>Безопасный OAuth</span></div>
          <div><BarChart3 /><span><strong>Прозрачные действия</strong>Журнал и контроль рисков</span></div>
        </section>

        <section id="pricing" className="landing-section pricing-section">
          <div className="section-copy"><h2>Бесплатный стек для MVP</h2><p>Платёжная система не нужна: используются бесплатные квоты сервисов.</p></div>
          <div className="pricing-grid">
            <article><h3>Supabase</h3><strong>$0<small>/мес.</small></strong><p>Авторизация и RLS<br />Postgres<br />Закрытое хранилище</p><Link className="button button-secondary" to="/login">Настроить</Link></article>
            <article className="featured"><span>Основа</span><h3>Vercel</h3><strong>$0<small>/мес.</small></strong><p>GitHub автодеплой<br />Serverless API<br />HTTPS и cron</p><Link className="button button-primary" to="/login">Запустить MVP</Link></article>
            <article><h3>Gemini + Meta</h3><strong>$0<small>/мес.</small></strong><p>AI Free Tier<br />Threads OAuth<br />Ручной fallback</p><Link className="button button-secondary" to="/login">Подключить</Link></article>
          </div>
        </section>
      </main>

      <footer className="landing-footer"><span>✦ Threads SMM Agent · 2026</span><span>Конфиденциальность · Условия · API</span></footer>
    </div>
  )
}
