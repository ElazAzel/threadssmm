import { ArrowRight, BarChart3, Bot, LockKeyhole, MessageSquareReply, Palette, Radar, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PLANS } from '../lib/pricing'

const features = [
  { icon: Sparkles, title: '15 AI-моделей от 5 провайдеров', text: 'Gemini, GPT, Grok, Claude, DeepSeek — выбирайте модель под задачу: от бюджетной до флагманской.' },
  { icon: Bot, title: 'Голос бренда', text: 'AI изучает тональность, лексику и ограничения бренда. Каждый пост звучит в вашем стиле.' },
  { icon: MessageSquareReply, title: 'AI Studio с любым форматом', text: 'Посты, треды, ответы, изображения — один промпт, три варианта на выбор.' },
  { icon: Palette, title: 'Генерация изображений', text: 'Imagen 3 и DALL·E 3 прямо в студии. Картинка к посту — без переключения сервисов.' },
  { icon: LockKeyhole, title: 'Контур согласования + аудит', text: 'Риск-анализ, compliance-скоринг, журнал действий. AI предлагает — человек утверждает.' },
  { icon: Radar, title: 'Мониторинг Threads', text: 'RSS-источники, тренды, упоминания. AI находит темы и предлагает безопасный угол реакции.' },
]

const metrics = [
  { value: '5', label: 'провайдеров AI' },
  { value: '15', label: 'моделей генерации' },
  { value: '99%', label: 'аптайм инфраструктуры' },
]

const securityCards = [
  { icon: LockKeyhole, title: 'Threads Official API', text: 'Только официальный OAuth. Никаких ботов и обходов. Полная совместимость с политикой Meta.' },
  { icon: LockKeyhole, title: 'AES-256 шифрование токенов', text: 'Токены доступа хранятся зашифрованно в private схеме БД. Никто не видит ваш ключ.' },
  { icon: BarChart3, title: 'Полный аудит', text: 'Каждое действие логируется. Согласование, публикация, подключение — всё прозрачно.' },
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
            <span className="hero-eyebrow">Threads API + 5 AI-провайдеров</span>
            <h1>AI SMM-агент для Threads.<br />15 моделей, один интерфейс.</h1>
            <p className="hero-lead">Gemini, GPT, Grok, Claude, DeepSeek — генерируйте посты, изображения и треды в голосе бренда. Согласование, публикация, аналитика.</p>
            <div className="hero-actions">
              <Link className="button button-primary button-lg" to="/login">
                Попробовать бесплатно <ArrowRight size={18} />
              </Link>
              <Link className="button button-secondary button-lg" to="/login">
                Войти в кабинет
              </Link>
            </div>
            <div className="provider-strip">
              {['Google Gemini', 'OpenAI', 'xAI Grok', 'Anthropic Claude', 'DeepSeek'].map((p) => (
                <span key={p} className="provider-pill">{p}</span>
              ))}
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
              <h2>Всё для Threads в одной платформе</h2>
              <p className="section-lead">15 AI-моделей, 5 провайдеров, изображения, согласование, аналитика и мониторинг.</p>
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

        <section id="pricing" className="pricing-section">
          <div className="container">
            <div className="section-header">
              <span className="section-eyebrow">Тарифы</span>
              <h2>От $15 до $149 в месяц</h2>
              <p className="section-lead">Все планы включают AI-генерацию. Чем выше план — тем дешевле токен и больше лимиты.</p>
            </div>
            <div className="pricing-grid">
              {PLANS.map((plan) => (
                <div key={plan.id} className={`pricing-card ${plan.id === 'creator' ? 'pricing-featured' : ''}`}>
                  {plan.id === 'creator' && <span className="pricing-badge">Рекомендуем</span>}
                  <h3>{plan.name}</h3>
                  <strong className="pricing-price">
                    ${plan.price}<small>/мес</small>
                  </strong>
                  <p className="pricing-desc">{plan.tokensPerMonth} токенов · {plan.maxBrands} бренда · {plan.maxAccounts} аккаунтов</p>
                  <ul>
                    {plan.features.map((item) => (
                      <li key={item}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5l10-10"/></svg> {item}</li>
                    ))}
                  </ul>
                  <Link
                    className={`button ${plan.id === 'creator' ? 'button-primary' : 'button-secondary'} full-button`}
                    to="/login"
                  >
                    {plan.id === 'starter' ? 'Начать бесплатно' : 'Выбрать'}
                  </Link>
                </div>
              ))}
            </div>
            <p className="pricing-footnote">Годовая подписка — минус 20%. Токен-паки от $19 за 200 токенов. 14 дней бесплатного доступа.</p>
          </div>
        </section>

        <section id="security" className="security-section">
          <div className="container">
            <div className="section-header">
              <span className="section-eyebrow">Безопасность</span>
              <h2>Enterprise-grade защита</h2>
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

        <section className="cta-section">
          <div className="container">
            <div className="cta-card">
              <h2>Готовы управлять Threads с AI?</h2>
              <p>14 дней бесплатного доступа. 50 токенов на старте. Без привязки карты.</p>
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
              <p>AI-агент для управления контентом в Threads. 15 моделей, 5 провайдеров, одна платформа.</p>
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
