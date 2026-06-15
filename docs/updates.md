# Обновления

## 2026-06-15

- Собрано единое React/Vite-приложение на основе desktop и mobile Stitch-макетов.
- Добавлены лендинг, onboarding и 10 разделов рабочего пространства.
- Реализованы локальные сценарии генерации, compliance-проверки, согласования и планирования.
- Добавлена адаптивная мобильная навигация и отдельные mobile-композиции ключевых экранов.
- Добавлены Vercel SPA rewrite, ESLint, TypeScript и команда `npm run verify`.
- Build toolchain обновлён до Vite 8; `npm audit` не обнаруживает уязвимостей.
- Добавлены Playwright smoke-тесты прямых SPA-маршрутов, полного approval-сценария и мобильной адаптивности.
- Добавлен GitHub Actions workflow для автоматической проверки перед публикацией через Vercel.
- Репозиторий подключён к Vercel, production опубликован на `https://threadssmm.vercel.app`.
- Production smoke-проверка подтвердила прямые SPA-маршруты, approval flow и мобильную адаптивность без runtime-ошибок.
