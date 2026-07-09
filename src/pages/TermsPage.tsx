import { Link } from 'react-router-dom'

export function TermsPage() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1.5rem', color: '#ccc', lineHeight: 1.7 }}>
      <Link to="/" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.9rem' }}>← На главную</Link>
      <h1 style={{ color: '#fff', fontSize: '2rem', margin: '1.5rem 0 0.5rem' }}>Условия использования</h1>
      <p style={{ color: '#666', fontSize: '0.85rem' }}>Последнее обновление: 1 марта 2025 г.</p>

      <h2 style={{ color: '#fff', marginTop: '2rem' }}>1. Общие положения</h2>
      <p>Threads SMM Agent (далее — «Сервис») предоставляет инструменты для управления контентом в социальной сети Threads от Meta. Используя Сервис, вы соглашаетесь с настоящими условиями.</p>

      <h2 style={{ color: '#fff', marginTop: '2rem' }}>2. Обязанности пользователя</h2>
      <ul><li>Соблюдать правила платформы Threads и Meta</li><li>Не публиковать незаконный, оскорбительный или спам-контент</li><li>Не использовать Сервис для автоматизированного сбора данных других пользователей</li><li>Обеспечивать сохранность своего пароля и токенов доступа</li></ul>

      <h2 style={{ color: '#fff', marginTop: '2rem' }}>3. Ограничение ответственности</h2>
      <p>Сервис предоставляется «как есть». Мы не гарантируем бесперебойную работу API Meta или доступность Threads. Мы не несём ответственности за блокировку вашего аккаунта Threads по инициативе Meta.</p>

      <h2 style={{ color: '#fff', marginTop: '2rem' }}>4. Тарифы и оплата</h2>
      <p>Условия тарифов указаны на странице pricing. Списание средств происходит ежемесячно. Возврат средств возможен в течение 14 дней с момента оплаты.</p>

      <h2 style={{ color: '#fff', marginTop: '2rem' }}>5. Прекращение доступа</h2>
      <p>Мы оставляем за собой право приостановить доступ к Сервису при нарушении условий использования или правил платформы Threads.</p>

      <h2 style={{ color: '#fff', marginTop: '2rem' }}>6. Контакты</h2>
      <p>По всем вопросам: support@threadssmm.app</p>
    </div>
  )
}