# Threads SMM Agent

Локальный ассистент Threads без обязательных API-ключей, регистрации и базы данных: импорт настоящих публикаций, анализ тем выборки, черновики постов/веток/ответов, резервные копии и открытие редактора Threads после проверки текста.

**Это ещё не автономный SMM-агент.** Сбор требует вашего нажатия в расширении, отправка требует вашего действия в Threads. Полная синхронизация соцсети, автономные комментарии и публикация без участия человека не реализованы и не проверены. [Путь к автономности и критерии приёмки](docs/autonomy-roadmap.md).

## Запустить без API

Требуется Node.js 24 (LTS) и npm. Не создавайте `.env` и не настраивайте Supabase.

```bash
npm ci
npm run dev:local
```

Откройте адрес Vite → `/assistant`. Для собранного приложения и необязательной локальной AI-модели:

```bash
npm run local
# http://127.0.0.1:4174/assistant
```

1. Импортируйте JSON, CSV или тексты постов. Никакие вымышленные данные не подставляются. Повторный импорт той же ссылки обновляет текст и метрики последней выборкой, сохраняя ссылки из черновиков; неизвестные значения не заменяются нулями.
2. Для сбора в браузере скачайте `public/downloads/threads-capture.zip`, распакуйте и установите расширение как unpacked в Chromium. [Инструкция сборщика](extensions/threads-capture/README.md). Оно читает только видимые посты открытой вкладки по вашему нажатию, без cookies, паролей или скрытых запросов.
3. Посмотрите повторяющиеся темы. Баллы относятся только к вашей выборке; неизвестные метрики отображаются как неизвестные.
4. Задайте голос автора. Подготовьте редактируемую структуру либо используйте установленную на своём компьютере [Ollama](docs/local-model.md) для настоящей генерации без внешних ключей. Шаблоны не выдаются за AI-тексты.
5. Проверьте текст, нажмите «Текст проверен» и откройте редактор Threads. Для комментария в intent передаётся shortcode конкретного исходного поста. Кнопка не отправляет текст автоматически.
6. Экспортируйте резервную копию. Данные хранятся только в браузере текущего адреса, не синхронизируются между устройствами. Очистка данных сайта без копии необратима.

### Границы local-first режима

- `/assistant` загружается отдельно от Supabase Auth/Workspace; нет обязательных облачных вызовов.
- `npm run build:local` явно выключает demo и облачные frontend-переменные.
- Пределы: импорт 2 МиБ, 1000 постов; резервная копия/сохранение 4 МиБ; создание до 200 черновиков; отправляемая часть до 500 Unicode-символов.
- Шаблоны содержат поля для собственных фактов и не проходят проверку до заполнения.
- Локальная Ollama вызывается только через сервер, привязанный к 127.0.0.1. Сервер не принимает удалённый URL, межсайтовые запросы и произвольные инструменты модели. Облачные функции самой Ollama нужно отключить по инструкции.
- Модель не скачивается и не запускается автоматически. Неустановленная Ollama не мешает импорту, анализу и шаблонам.
- Реальная разметка Threads может измениться. Сборщик имеет тесты на HTML-фикстурах, но совместимость с текущей авторизованной лентой ещё не проверена. Не гарантируется полнота захвата.
- Открытие Threads передаёт проверенный текст и, для ответа, целевой shortcode. Статус «опубликован» устанавливается лишь по введённой пользователем ссылке, не считается проверенным сервером.

[Исследование открытых решений и официальных ограничений](docs/threads-research-2026-11-09.md). [Статус проверки](docs/verification-local-first.md).

## Облачный режим (необязательный)

Существующие Supabase, внешние AI-провайдеры, согласования и официальный Meta API сохранены отдельным облачным режимом. Они требуют собственных ключей и OAuth. Сведения ниже относятся к этому режиму, а не к локальному ассистенту.

- **Production**: [threadssmm.vercel.app](https://threadssmm.vercel.app)
- **Репозиторий**: [ElazAzel/threadssmm](https://github.com/ElazAzel/threadssmm)

---

## Стек

| Компонент | Технология | Тариф |
|-----------|-----------|-------|
| Фронтенд | React 19, TypeScript, Vite 8 | Vercel Hobby |
| API (Vercel) | Serverless Functions | Vercel Hobby |
| База данных | PostgreSQL 17 + RLS | Supabase Free |
| Аутентификация | Supabase Auth | Supabase Free |
| Хранилище | Supabase Storage | Supabase Free |
| AI-генерация | Google Gemini API | Gemini Free Tier |
| Соцсеть | Meta Threads API | Бесплатно |
| CI/CD | GitHub Actions → Vercel | Встроено |

---

## Демо облачного интерфейса

```bash
npm install
npm run dev:demo     # демо-режим без внешних сервисов
```

Демо-режим включает встроенные тестовые данные и не требует подключения к Supabase, Gemini или Threads. Используется для разработки UI и E2E-тестов.

### Полный локальный запуск (с PostgreSQL)

```bash
# Терминал 1: API-сервер (PostgreSQL + Supabase-совместимый REST)
npm run dev:server

# Терминал 2: Фронтенд
npm run dev
```

Требования:
- PostgreSQL 17, база `supabase_local_dev`
- Миграции применены: `supabase/migrations/`
- Бутстрап схемы: `supabase/bootstrap.sql`

---

## Архитектура

```
threads-smm-agent/
├── src/                    # React SPA
│   ├── main.tsx            # Точка входа (BrowserRouter → AuthProvider → WorkspaceProvider → App)
│   ├── App.tsx             # Роутинг (lazy-loaded pages)
│   ├── components/         # AppShell, ProtectedRoute, ui-компоненты
│   ├── contexts/           # AuthContext (Supabase auth / demo fallback)
│   │                       # WorkspaceContext (все данные: brands, drafts, approvals, media, monitor)
│   ├── lib/                # env.ts (VITE_* vars), supabase.ts (client), api.ts (fetch-wrapper),
│   │                       # domain.ts (types), database.types.ts (Supabase Row types)
│   ├── pages/              # 8 файлов-групп (Landing, Login, Dashboard, Content, Operations, Insights и т.д.)
│   └── styles.css          # Единый CSS (без CSS-in-JS)
├── api/                    # Vercel Serverless Functions
│   ├── _lib/               # http.ts, supabaseServer.ts, threads.ts (общая логика)
│   ├── health.ts           # GET /api/health — диагностика окружения
│   ├── ai/generate.ts      # POST /api/ai/generate — Gemini-генерация
│   ├── threads/            # OAuth (connect.ts, callback.ts) и publish.ts
│   ├── monitor/rss.ts      # GET /api/monitor/rss — парсинг RSS-лент
│   └── cron/publish.ts     # POST /api/cron/publish — страховочный крон публикации
├── server/                 # Локальный dev-сервер (Express 5)
│   └── index.js            # Замена Supabase: REST + Auth + Storage API
├── supabase/
│   ├── migrations/         # 2 SQL-миграции (15 таблиц, RLS, RPC, триггеры)
│   ├── bootstrap.sql       # Локальный бутстрап (roles, auth.users, storage schema)
│   └── config.toml         # Конфигурация Supabase CLI
├── tests/e2e/              # Playwright-тесты (Chromium)
├── account_management/     # Изолированные feature-модули (не используются из src/)
├── ai_studio/              # (извлечены из отдельных макетов)
└── docs/                   # Документация
```

### Ключевые потоки данных

```
Браузер ←→ Supabase Client (src/lib/supabase.ts)
              ├── Auth: signUp / signIn / getSession → (Cloud: Supabase Auth | Local: server/index.js:53)
              ├── REST: from('table').select/insert/update/delete → (Cloud: PostgREST | Local: server/index.js:111)
              ├── RPC: rpc('function_name', args) → (Cloud: PostgREST | Local: server/index.js:90)
              └── Storage: upload/createSignedUrl → (Cloud: Supabase Storage | Local: server/index.js:165)

Vercel Functions (api/) ←→ Supabase Admin Client
              ├── AI generation → Gemini API
              ├── Threads publish → Meta Graph API
              └── RSS monitor → Внешние RSS-ленты
```

### Контексты

- **AuthContext** — обёртка над `supabase.auth`. При `VITE_DEMO_MODE=true` подставляет демо-пользователя.
- **WorkspaceContext** — единый источник данных: workspace, brands, accounts, drafts, approvals, mediaAssets, monitorSources/Items, workspaceSettings, auditLogs. Все CRUD-операции идут через этот контекст.

---

## База данных

15 таблиц в схеме `public`, служебные в `private`:

| Таблица | Назначение |
|---------|-----------|
| `profiles` | Профили пользователей (создаются триггером при регистрации) |
| `workspaces` | Рабочие пространства |
| `workspace_members` | Участники и роли (owner, admin, editor, viewer) |
| `workspace_settings` | Настройки безопасности, AI, уведомлений |
| `brands` | Профили брендов (ниша, tone of voice, goals, competitors) |
| `ai_settings` | Настройки AI-генерации (модель, температура, лимиты) |
| `threads_accounts` | Подключенные аккаунты Threads |
| `drafts` | Черновики контента (post, thread, reply) |
| `approvals` | Согласования черновиков |
| `media_assets` | Медиафайлы (изображения) |
| `monitor_sources` | RSS-источники для мониторинга |
| `monitor_items` | Найденные материалы (с анализом тональности, релевантности) |
| `post_metrics` | Метрики опубликованных постов |
| `usage_events` | Списание AI-кредитов |
| `audit_logs` | Аудит действий команды |

**Ключевые RPC-функции**: `create_workspace_with_defaults`, `request_draft_approval`, `review_draft_approval`, `reserve_ai_credit`, `refund_ai_credit`, `check_api_rate_limit`, `store_threads_token`, `get_threads_token`.

**Безопасность**: RLS на всех таблицах, роли `anon/authenticated/service_role`, приватная схема для токенов.

---

## Переменные окружения

Все переменные в `.env.example`. Правила:

- `VITE_*` — клиентские, попадают в бандл. Должны быть заданы для `supabase-js` (frontend).
- `SUPABASE_SECRET_KEY`, `GEMINI_API_KEY`, `THREADS_*`, `TOKEN_ENCRYPTION_KEY`, `CRON_SECRET` — только серверные. **Никогда не использовать с префиксом `VITE_`**.
- Для локальной разработки `VITE_SUPABASE_URL=http://127.0.0.1:54321`

---

## Команды

```bash
npm run dev           # Frontend (Vite dev server, порт 5173)
npm run dev:server    # API-сервер (Express 5, порт 54321)
npm run dev:demo      # Демо-режим (без backend)
npm run build         # tsc -b && vite build
npm run build:test    # Демо-сборка для E2E-тестов
npm run lint          # ESLint
npm run preview       # Vite preview (порт 4173)
npm run test:e2e      # Playwright-тесты
npm run verify        # Lint, unit, local server, typecheck, cloud demo E2E, local production E2E
```

---

## Тестирование

```bash
npx playwright install chromium
npm run verify
```

- Playwright, только Chromium
- Требуется демо-сборка: `npm run build:test` → `npm run preview`
- CI: 2 retries. Локально: 0 retries
- 10+ E2E-сценариев: авторизация, onboarding, создание контента, согласование, календарь, мониторинг

---

## Деплой (Vercel)

```bash
npx vercel --prod
```

- `vercel.json` — SPA rewrites для `/app/*`, `/login`, `/setup`, `/onboarding`
- Ежедневный cron `0 8 * * *` → `/api/cron/publish` (страховка для scheduled-постов)
- Cron не гарантирует точную минуту — используйте ручную публикацию для точного времени

---

## Особенности

- **Express 5**: Wildcard-роуты `:path(*)` не работают (path-to-regexp v8). Используйте regex: `/^\/route\/(.+)/`.
- **Локализация**: UI на русском языке.
- **Соглашения кода**: arrow functions, named exports (без `export default`), без комментариев в коде.
- **Бесплатный стек**: ни один сервис не требует платной подписки.
- **Демо-режим**: только для E2E-тестов. Production никогда не использует demo-заглушки; локальный режим использует только пользовательские данные.

---

## Ссылки

- [Репозиторий](https://github.com/ElazAzel/threadssmm)
- [Production](https://threadssmm.vercel.app)
- [Roadmap](docs/product-roadmap.md)
- [AGENTS.md](AGENTS.md)
