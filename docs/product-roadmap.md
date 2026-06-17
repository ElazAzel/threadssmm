# Threads SMM Agent — roadmap и журнал реализации

Документ фиксирует текущий план развития продукта и служит рабочим списком для последующих итераций. После каждого существенного изменения агент или разработчик должен обновлять блоки статуса.

## Состояние на 2026-06-17

MVP уже собран как рабочее React/Vite-приложение с Vercel Functions и Supabase-схемой. В коде есть авторизация, onboarding, рабочие пространства, профили бренда, аккаунты Threads, AI Studio через Gemini, черновики, согласования, календарь, медиатека, RSS-мониторинг, базовая аналитика и Vercel-деплой.

Главный текущий блокер: production опубликован, но не активирован, потому что в Vercel пока не заданы Supabase, Gemini и Meta Threads переменные окружения.

## Принцип продукта

Threads SMM Agent не должен становиться универсальным SMM-комбайном. Основная ценность:

> Бренд описывает контекст один раз, AI готовит контент, команда согласует, календарь публикует, аналитика показывает, что повторять.

## Фаза 0 — production activation

- [x] Зафиксировать roadmap в документах проекта.
- [x] Добавить production setup diagnostics без раскрытия секретов.
- [ ] Создать Supabase Free project.
- [ ] Применить миграцию из `supabase/migrations`.
- [ ] Добавить Vercel env для frontend Supabase:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
- [ ] Добавить Vercel env для server functions:
  - `SUPABASE_URL`
  - `SUPABASE_PUBLISHABLE_KEY`
  - `SUPABASE_SECRET_KEY`
- [ ] Добавить Gemini:
  - `GEMINI_API_KEY`
  - `GEMINI_MODEL`
- [ ] Добавить Meta Threads API:
  - `THREADS_APP_ID`
  - `THREADS_APP_SECRET`
  - `THREADS_REDIRECT_URI`
  - `TOKEN_ENCRYPTION_KEY`
- [ ] Добавить cron secret:
  - `CRON_SECRET`
- [ ] Перезапустить Vercel deployment после env.
- [ ] Пройти production smoke: login, onboarding, brand, AI generation, approval, schedule, media, RSS.

## Фаза 1 — стабилизация MVP

- [ ] Сгенерировать Supabase DB types и подключить typed Database к client/server Supabase.
- [ ] Перевести списание AI-кредитов на atomic RPC, чтобы исключить гонки.
- [ ] Добавить rate limiting на AI, RSS и publish endpoints.
- [ ] Улучшить обработку ошибок Gemini, Threads и Supabase в UI.
- [ ] Подключить бесплатный error monitoring или минимальный server/client logging.
- [ ] Усилить Supabase security вокруг private schema и token helpers.
- [ ] Добавить интеграционные тесты API-функций с моками внешних провайдеров.

## Фаза 2 — основной продуктовый функционал

- [ ] AI Studio: batch generation, rewrite modes, presets тона, сохраненные промпты.
- [ ] Brand Profile: brand memory, forbidden claims, examples library.
- [ ] Approval Inbox: комментарии, история правок, возврат на доработку.
- [ ] Calendar: week/month views, drag-and-drop, conflict detection.
- [ ] Monitoring: RSS item → идея → черновик в один клик.
- [ ] Media Library: теги, поиск, связь медиа с брендом и постом.
- [ ] Accounts: полноценные состояния OAuth, token expiry, publish diagnostics.

## Фаза 3 — аналитика и обучение системы

- [ ] Подключить продуктовую аналитику на бесплатном тарифе.
- [ ] Добавить события activation funnel:
  - `workspace_created`
  - `brand_completed`
  - `draft_generated`
  - `draft_approved`
  - `post_scheduled`
  - `post_published`
  - `publish_failed`
  - `account_connected`
- [ ] Добавить performance analytics по опубликованным Threads posts.
- [ ] Сопоставлять hook score, approval rate и фактические результаты.
- [ ] Добавить рекомендации: темы, частота, форматы, риски.

## Фаза 4 — commercial readiness без платных зависимостей

- [ ] Free-plan limits через `usage_events` и workspace credits.
- [ ] Manual upgrade через админа без платежной системы.
- [ ] Team roles: owner, editor, approver.
- [ ] Audit log для действий команды.
- [ ] CSV/PDF export отчетов.
- [ ] Landing с четким позиционированием и product proof.

## Сделано

### 2026-06-17

- Создан roadmap/progress документ.
- Реализована setup diagnostics для production readiness: frontend показывает статус client/server env, serverless endpoint `/api/health` сообщает наличие server-only переменных без раскрытия секретов.
- Добавлена e2e-проверка setup-экрана и mobile overflow coverage для `/setup`.
