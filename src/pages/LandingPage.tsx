import { ArrowRight, BarChart3, LockKeyhole, Radar, ShieldCheck, Sparkles, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'

const dashboardImage = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCKXdyT8pZYWSEkk1WcakBKch0K5S647jXpouuEeA9oiKCCLlkBVRLF-ZZ5hS41Gg2ZfdfV5wfb78UiH5el8wY-Cyo1Ml4vORnXQf2Gh7pzoSVfxhsPvTvj_xc_UT7hB_008vm61HWquXw9lAxWn-nXAnYUdjoLlZVeHFIipQhJW1tKf_eTyxEeb3Ns5Lvi1csMOw8Wf_O6XjuqCLEU4zb5-XCaVhymopPOTQxVzyTDqFpJHKW0rGJ6EwWhkyvge7o6AG5OBrw7qZg'

const features = [
  { icon: Sparkles, title: 'AI-стратегия контента', text: 'Цели, аудитория, стиль и ограничения бренда — агент строит контент-план, который работает на результат.' },
  { icon: UsersRound, title: 'Голос бренда', text: 'Агент изучает ваши тексты и поддерживает лексику, ритм, тон и правила коммуникации.' },
  { icon: LockKeyhole, title: 'Контур согласования', text: 'AI предлагает — человек утверждает. Риск-анализ, compliance и полный контроль.' },
  { icon: Radar, title: 'Мониторинг и реакции', text: 'Система находит релевантные темы и упоминания, предлагает безопасный угол реакции.' },
]

const plans = [
  {
    name: 'Starter', price: '0', suffix: '/мес',
    desc: 'Для знакомства с платформой',
    items: ['1 аккаунт Threads', '10 постов в день', 'AI-генерация контента', 'Базовый мониторинг'],
    featured: false,
  },
  {
    name: 'Pro', price: '1 490', suffix: '/мес',
    desc: 'Для активных авторов и SMM',
    items: ['5 аккаунтов', 'Неограниченно постов', 'Вся AI-студия', 'Мониторинг + аналитика', 'Контур согласования', 'Приоритетная поддержка'],
    featured: true,
  },
  {
    name: 'Enterprise', price: 'Индивидуально', suffix: '',
    desc: 'Для агентств и команд',
    items: ['Безлимит аккаунтов', 'White-label', 'Выделенный сервер', 'API-доступ', 'SLA 99.9%'],
    featured: false,
  },
]

const metrics = [
  { value: '10K+', label: 'сгенерировано постов' },
  { value: '98%', label: 'публикаций без риска' },
  { value: '3 мин', label: 'на запуск первого поста' },
]

const securityCards = [
  { icon: ShieldCheck, title: 'Только официальный API', text: 'Без скрытой автоматизации и ботов. Полная спецификация Meta Threads API.' },
  { icon: LockKeyhole, title: 'Безопасный OAuth', text: 'Пароли не нужны — токены доступа шифруются и никогда не покидают ваш workspace.' },
  { icon: BarChart3, title: 'Журнал аудита', text: 'Каждое действие фиксируется. Прозрачность и контроль на всех этапах.' },
]

export function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <Link to="/" className="landing-logo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          Threads SMM Agent
        </Link>
        <nav>
          <a href="#features">Возможности</a>
          <a href="#pricing">Тарифы</a>
          <a href="#security">Безопасность</a>
        </nav>
        <div className="landing-header-actions">
          <Link className="button button-ghost" to="/login">Войти</Link>
          <Link className="button button-primary" to="/login">Начать</Link>
        </div>
      </header>

      <main>
        <section className="hero-section">
          <div className="container">
            <span className="hero-eyebrow">Now with Threads API</span>
            <h1>Ваш AI SMM-агент для Threads</h1>
            <p className="hero-lead">Планируйте, создавайте, согласовывайте и анализируйте контент в системе, которая понимает голос бренда и оставляет контроль человеку.</p>
            <div className="hero-actions">
              <Link className="button button-primary button-lg" to="/login">
                Попробовать бесплатно <ArrowRight size={18} />
              </Link>
              <Link className="button button-secondary button-lg" to="/login">
                Войти в кабинет
              </Link>
            </div>
            <div className="hero-preview">
              <div className="hero-preview-bar"><span /><span /><span /></div>
              <img src={dashboardImage} alt="Демонстрация панели Threads SMM Agent" loading="lazy" />
            </div>
          </div>
        </section>

        <section className="metrics-section">
          <div className="container metrics-grid">
            {metrics.map((m) => (
              <div key={m.value} className="metric-item">
                <strong>{m.value}</strong>
                <span>{m.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="features-section">
          <div className="container">
            <div className="section-header">
              <span className="section-eyebrow">Возможности</span>
              <h2>Управляйте системой, а не хаосом</h2>
              <p className="section-lead">От стратегии до публикации — всё в единой системе с AI-помощью на каждом этапе.</p>
            </div>
            <div className="features-grid">
              {features.map(({ icon: Icon, title, text }, i) => (
                <div key={title} className="feature-card" style={{ '--delay': `${i * 80}ms` } as React.CSSProperties}>
                  <Icon size={22} />
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="security" className="security-section">
          <div className="container">
            <div className="section-header">
              <span className="section-eyebrow">Безопасность</span>
              <h2>Контроль, которому можно доверять</h2>
            </div>
            <div className="security-grid">
              {securityCards.map(({ icon: Icon, title, text }, i) => (
                <div key={title} className="security-card" style={{ '--delay': `${i * 80}ms` } as React.CSSProperties}>
                  <Icon size={24} />
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="pricing-section">
          <div className="container">
            <div className="section-header">
              <span className="section-eyebrow">Тарифы</span>
              <h2>Начните бесплатно, растите с нами</h2>
              <p className="section-lead">Бесплатный старт с основными возможностями. Расширяйте по мере роста.</p>
            </div>
            <div className="pricing-grid">
              {plans.map((plan) => (
                <div key={plan.name} className={`pricing-card ${plan.featured ? 'pricing-featured' : ''}`}>
                  {plan.featured && <span className="pricing-badge">Рекомендуем</span>}
                  <h3>{plan.name}</h3>
                  <strong className="pricing-price">
                    {plan.price}<small>{plan.suffix}</small>
                  </strong>
                  <p className="pricing-desc">{plan.desc}</p>
                  <ul>
                    {plan.items.map((item) => (
                      <li key={item}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5l10-10"/></svg> {item}</li>
                    ))}
                  </ul>
                  <Link
                    className={`button ${plan.featured ? 'button-primary' : 'button-secondary'} full-button`}
                    to="/login"
                  >
                    {plan.featured ? 'Начать бесплатно' : 'Подробнее'}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="cta-section">
          <div className="container">
            <div className="cta-card">
              <h2>Готовы управлять контентом с AI?</h2>
              <p>14 дней бесплатного доступа. Без привязки карты.</p>
              <Link className="button button-primary button-lg" to="/login">
                Попробовать бесплатно <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <Link to="/" className="landing-logo">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                Threads SMM Agent
              </Link>
              <p>AI-агент для управления контентом в Threads. Создавайте, публикуйте и анализируйте с умом.</p>
            </div>
            <div className="footer-col">
              <h4>Продукт</h4>
              <a href="#features">Возможности</a>
              <a href="#pricing">Тарифы</a>
              <Link to="/login">Войти</Link>
            </div>
            <div className="footer-col">
              <h4>Ресурсы</h4>
              <Link to="/privacy">Политика</Link>
              <Link to="/terms">Условия</Link>
            </div>
            <div className="footer-col">
              <h4>Компания</h4>
              <a href="#">Контакты</a>
              <Link to="/terms">Условия</Link>
              <Link to="/privacy">Конфиденциальность</Link>
            </div>
          </div>
          <div className="footer-bottom">
            <span>Threads SMM Agent · 2026</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
