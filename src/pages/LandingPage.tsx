import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight, BarChart3, CheckSquare, LockKeyhole, Radar,
  ShieldCheck, Sparkles, UsersRound, ChevronRight, Quote,
} from 'lucide-react'
import { Link } from 'react-router-dom'

const dashboardImage = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCKXdyT8pZYWSEkk1WcakBKch0K5S647jXpouuEeA9oiKCCLlkBVRLF-ZZ5hS41Gg2ZfdfV5wfb78UiH5el8wY-Cyo1Ml4vORnXQf2Gh7pzoSVfxhsPvTvj_xc_UT7hB_008vm61HWquXw9lAxWn-nXAnYUdjoLlZVeHFIipQhJW1tKf_eTyxEeb3Ns5Lvi1csMOw8Wf_O6XjuqCLEU4zb5-XCaVhymopPOTQxVzyTDqFpJHKW0rGJ6EwWhkyvge7o6AG5OBrw7qZg'

const features = [
  { num: '01', icon: Sparkles, title: 'AI-стратегия контента', text: 'Цели, аудитория, стиль и ограничения бренда — агент строит контент-план, который работает на результат.' },
  { num: '02', icon: UsersRound, title: 'Голос бренда', text: 'Агент изучает ваши тексты и поддерживает лексику, ритм, тон и правила коммуникации.' },
  { num: '03', icon: CheckSquare, title: 'Контур согласования', text: 'AI предлагает — человек утверждает. Риск-анализ, compliance и полный контроль.' },
  { num: '04', icon: Radar, title: 'Мониторинг и реакции', text: 'Система находит релевантные темы и упоминания, предлагает безопасный угол реакции.' },
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

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold: 0.08 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { ref, visible }
}

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useScrollReveal()
  return (
    <div
      ref={ref}
      className={`reveal ${visible ? 'reveal-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="landing-page">
      <header className="landing-header">
        <Link to="/" className="landing-logo"><Sparkles size={18} /> Threads SMM Agent</Link>
        <nav className={menuOpen ? 'nav-open' : ''}>
          <a href="#features">Возможности</a>
          <a href="#pricing">Тарифы</a>
          <a href="#security">Безопасность</a>
          <div className="nav-mobile-cta">
            <Link className="button button-ghost" to="/login">Войти</Link>
            <Link className="button button-primary" to="/login">Начать</Link>
          </div>
        </nav>
        <div className="landing-header-actions">
          <Link className="button button-ghost" to="/login">Войти</Link>
          <Link className="button button-primary" to="/login">Начать</Link>
        </div>
        <button className="burger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Меню">
          <span className={`burger-line ${menuOpen ? 'open' : ''}`} />
        </button>
      </header>

      <main>
        <section className="hero">
          <Reveal>
            <span className="hero-badge">Now with Threads API</span>
          </Reveal>
          <Reveal delay={80}>
            <h1>Ваш <span>AI SMM-агент</span><br />для Threads</h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="hero-lead">Планируйте, создавайте, согласовывайте и анализируйте контент в системе, которая понимает голос бренда и оставляет контроль человеку.</p>
          </Reveal>
          <Reveal delay={240} className="hero-actions">
            <Link className="button button-primary" to="/login">
              Попробовать бесплатно <ArrowRight size={16} />
            </Link>
            <Link className="button button-secondary" to="/login">
              Войти в кабинет
            </Link>
          </Reveal>
          <Reveal delay={320}>
            <div className="hero-preview">
              <div className="preview-dots"><i /><i /><i /></div>
              <img src={dashboardImage} alt="Демонстрация панели Threads SMM Agent" />
            </div>
          </Reveal>
        </section>

        <section className="trust-strip">
          <Reveal delay={0}>
            <div>
              <strong>10K+</strong>
              <span>сгенерировано постов</span>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <div>
              <strong>98%</strong>
              <span>публикаций без риска</span>
            </div>
          </Reveal>
          <Reveal delay={160}>
            <div>
              <strong>3 мин</strong>
              <span>на запуск первого поста</span>
            </div>
          </Reveal>
        </section>

        <section id="features" className="landing-section features-section">
          <Reveal className="section-header">
            <span className="section-label">Возможности</span>
            <h2>Управляйте системой,<br />а не хаосом</h2>
            <p className="section-lead">От стратегии до публикации — всё в единой системе с AI-помощью на каждом этапе.</p>
          </Reveal>
          <div className="features-grid">
            {features.map(({ num, icon: Icon, title, text }, i) => (
              <Reveal key={num} delay={i * 80} className="feature-card">
                <span className="feature-num">{num}</span>
                <Icon size={22} className="feature-icon" />
                <h3>{title}</h3>
                <p>{text}</p>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="security" className="landing-section security-section">
          <Reveal className="section-header">
            <span className="section-label">Безопасность</span>
            <h2>Контроль, которому<br />можно доверять</h2>
          </Reveal>
          <div className="security-grid">
            <Reveal delay={0} className="security-card">
              <ShieldCheck size={24} />
              <h3>Только официальный API</h3>
              <p>Без скрытой автоматизации и ботов. Полная спецификация Meta Threads API.</p>
            </Reveal>
            <Reveal delay={80} className="security-card">
              <LockKeyhole size={24} />
              <h3>Безопасный OAuth</h3>
              <p>Пароли не нужны — токены доступа шифруются и никогда не покидают ваш workspace.</p>
            </Reveal>
            <Reveal delay={160} className="security-card">
              <BarChart3 size={24} />
              <h3>Журнал аудита</h3>
              <p>Каждое действие фиксируется. Прозрачность и контроль на всех этапах.</p>
            </Reveal>
          </div>
        </section>

        <section id="pricing" className="landing-section pricing-section">
          <Reveal className="section-header">
            <span className="section-label">Тарифы</span>
            <h2>Начните бесплатно,<br />растите с нами</h2>
            <p className="section-lead">Бесплатный старт с основными возможностями. Расширяйте по мере роста.</p>
          </Reveal>
          <div className="pricing-grid">
            {plans.map((plan, i) => (
              <Reveal key={plan.name} delay={i * 100} className={`pricing-card ${plan.featured ? 'pricing-featured' : ''}`}>
                {plan.featured && <span className="pricing-badge">Рекомендуем</span>}
                <h3>{plan.name}</h3>
                <strong className="pricing-price">
                  {plan.price}<small>{plan.suffix}</small>
                </strong>
                <p className="pricing-desc">{plan.desc}</p>
                <ul>
                  {plan.items.map((item) => (
                    <li key={item}><ChevronRight size={12} /> {item}</li>
                  ))}
                </ul>
                <Link
                  className={`button ${plan.featured ? 'button-primary' : 'button-secondary'} full-button`}
                  to="/login"
                >
                  {plan.featured ? 'Начать бесплатно' : 'Подробнее'}
                </Link>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="closing-cta">
          <Reveal className="closing-inner">
            <div className="closing-content">
              <Quote size={28} className="closing-quote" />
              <h2>Готовы управлять<br />контентом с AI?</h2>
              <p>14 дней бесплатного доступа. Без привязки карты.</p>
              <Link className="closing-button" to="/login">
                Попробовать бесплатно <ArrowRight size={18} />
              </Link>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="landing-logo"><Sparkles size={16} /> Threads SMM Agent</Link>
            <p>AI-агент для управления контентом в Threads. Создавайте, публикуйте и анализируйте с умом.</p>
          </div>
          <div className="footer-col">
            <h5>Продукт</h5>
            <a href="#features">Возможности</a>
            <a href="#pricing">Тарифы</a>
            <Link to="/login">Войти</Link>
          </div>
          <div className="footer-col">
            <h5>Ресурсы</h5>
            <a href="#">Документация</a>
            <a href="#">API Reference</a>
            <a href="#">Блог</a>
          </div>
          <div className="footer-col">
            <h5>Компания</h5>
            <a href="#">О нас</a>
            <a href="#">Контакты</a>
            <a href="#">Условия</a>
            <a href="#">Конфиденциальность</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>✦ Threads SMM Agent · 2026</span>
        </div>
      </footer>
    </div>
  )
}
