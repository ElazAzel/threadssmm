# Threads SMM Agent — Roadmap

## Принцип продукта

> Бренд описывает контекст один раз, AI готовит контент, команда согласует, календарь публикует, аналитика показывает, что повторять.

Threads SMM Agent не универсальный SMM-комбайн, а сфокусированный инструмент для управления контентом в Threads.

---

## Фаза 0 — Infrastructure & Production

- [x] Создать Supabase Free project
- [x] Применить миграции из `supabase/migrations/`
- [x] Локальный PostgreSQL + Supabase-совместимый API сервер (`server/`)
- [x] AGENTS.md для OpenCode
- [x] README с полным описанием проекта
- [x] GitHub: репозиторий, коммиты, пуши
- [ ] Vercel: добавить переменные окружения:
  - `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
  - `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`
  - `GEMINI_API_KEY`, `GEMINI_MODEL`
  - `THREADS_APP_ID`, `THREADS_APP_SECRET`, `THREADS_REDIRECT_URI`
  - `TOKEN_ENCRYPTION_KEY`, `CRON_SECRET`
- [ ] Production smoke: login → onboarding → brand → AI → approval → schedule → media → RSS

## Фаза 1 — MVP Stabilization

- [x] Supabase DB types + typed Database
- [x] Атомарное списание AI-кредитов (RPC)
- [x] Rate limiting на AI, RSS, publish endpoints
- [x] Обработка ошибок Gemini, Threads, Supabase в UI
- [x] RLS и grants по ролям workspace
- [x] Audit log
- [ ] Error monitoring (бесплатный)
- [ ] Интеграционные тесты API с моками
- [ ] CI/CD (GitHub Actions → Vercel)

## Фаза 2 — Core Product Features

- [ ] **AI Studio**: batch generation, rewrite modes, presets тона, история промптов
- [ ] **Brand Profile**: brand memory, forbidden claims, examples library
- [ ] **Approval Inbox**: комментарии, история правок, возврат на доработку
- [ ] **Calendar**: week/month views, drag-and-drop, conflict detection
- [ ] **Media Library**: теги, поиск, связь с брендом и постом
- [ ] **Accounts**: полноценный OAuth, token expiry, publish diagnostics

## Фаза 3 — Analytics & Learning

- [ ] Продуктовая аналитика (бесплатный тариф)
- [ ] Activation funnel: `workspace_created` → `brand_completed` → `draft_generated` → `draft_approved` → `post_scheduled` → `post_published`
- [ ] Performance analytics по опубликованным постам
- [ ] Рекомендации: темы, частота, форматы, риски

## Фаза 4 — Commercial Readiness

- [x] Free-plan limits (usage_events, workspace credits)
- [ ] Manual upgrade (админ, без платёжной системы)
- [ ] Team roles: owner, editor, approver (RLS готов, нужен UI управления)
- [ ] CSV/PDF export отчётов
- [ ] Landing с позиционированием и product proof

---

## История

### 2026-07-08
- Локальный PostgreSQL 17 + API-сервер (Express 5, порт 54321)
- Бутстрап Supabase-схемы (roles, auth.users, storage)
- AGENTS.md с командами и архитектурой
- README: полное описание проекта

### 2026-06-18
- Миграция стабилизации ядра: атомарный onboarding, credit reservation, rate limit, approval RPC
- Typed Database для frontend/server
- Ужесточены RLS, grants, Storage policies
- 10 E2E-тестов, `npm run verify` проходит

### 2026-06-17
- Roadmap/progress document
- Диагностика окружения (`/api/health`, `/setup`)
- Playwright smoke-тесты

### 2026-06-15
- Сборка React/Vite-приложения из desktop/mobile макетов
- Лендинг, onboarding, 10 разделов workspace
- Vite 8, ESLint, TypeScript, Playwright
- Деплой на Vercel
