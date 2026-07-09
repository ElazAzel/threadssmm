import { Link } from 'react-router-dom'

export function PrivacyPage() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1.5rem', color: '#ccc', lineHeight: 1.7 }}>
      <Link to="/" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.9rem' }}>← На главную</Link>
      <h1 style={{ color: '#fff', fontSize: '2rem', margin: '1.5rem 0 0.5rem' }}>Политика конфиденциальности</h1>
      <p style={{ color: '#666', fontSize: '0.85rem' }}>Последнее обновление: 1 марта 2025 г.</p>

      <h2 style={{ color: '#fff', marginTop: '2rem' }}>1. Какие данные мы собираем</h2>
      <p>При использовании Threads SMM Agent мы можем собирать:</p>
      <ul><li>Информацию об аккаунте Threads (username, display name, avatar)</li><li>Контент, который вы создаёте и публикуете через сервис</li><li>Метрики взаимодействия с вашими публикациями</li><li>Данные об использовании сервиса (частота запросов к AI, объём контента)</li></ul>

      <h2 style={{ color: '#fff', marginTop: '2rem' }}>2. Как мы используем данные</h2>
      <p>Данные используются исключительно для функционирования сервиса: создания и публикации контента, аналитики, улучшения AI-генерации. Мы не продаём ваши данные третьим лицам.</p>

      <h2 style={{ color: '#fff', marginTop: '2rem' }}>3. Хранение и шифрование</h2>
      <p>Токены доступа к Threads хранятся в зашифрованном виде (AES-256-GCM). Все данные передаются по TLS. Мы применяем стандартные меры безопасности для защиты вашей информации.</p>

      <h2 style={{ color: '#fff', marginTop: '2rem' }}>4. Сookies и трекинг</h2>
      <p>Мы используем минимально необходимые cookies для поддержания сессии. Сторонние трекеры не используются.</p>

      <h2 style={{ color: '#fff', marginTop: '2rem' }}>5. Ваши права</h2>
      <p>Вы можете в любой момент запросить удаление ваших данных, отозвать доступ к Threads или экспортировать свои данные. Для этого напишите нам на privacy@threadssmm.app.</p>

      <h2 style={{ color: '#fff', marginTop: '2rem' }}>6. Изменения политики</h2>
      <p>Мы будем уведомлять вас об изменениях политики конфиденциальности по email и в интерфейсе сервиса.</p>
    </div>
  )
}