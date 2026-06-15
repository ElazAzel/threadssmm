# Threads SMM Agent

Рабочий MVP для Threads: авторизация, профили бренда, Gemini-генерация, черновики, согласование, календарь, RSS-мониторинг, медиатека и публикация через официальный Meta Threads API.

- Production: [threadssmm.vercel.app](https://threadssmm.vercel.app)
- Repository: [ElazAzel/threadssmm](https://github.com/ElazAzel/threadssmm)

## Бесплатный стек

- Vercel Hobby: frontend, API functions, HTTPS, ежедневный safety-cron.
- Supabase Free: Auth, Postgres с RLS, закрытый Storage.
- Google AI Studio: Gemini Free Tier, если бесплатная квота доступна в регионе.
- Meta Threads API: официальный OAuth и публикация без паролей/cookies.

Платёжная система не подключена.

## Локальная демо-сборка

```bash
npm install
npm run dev:demo
```

Демо-режим используется только для визуальных E2E-тестов. Обычная production-сборка не подменяет отсутствующий backend заглушками.

## Supabase

1. Создайте проект Supabase Free.
2. Выполните миграцию:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

3. В Supabase Auth укажите Site URL `https://threadssmm.vercel.app`.
4. Добавьте в Vercel значения из Project Settings → API:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
```

`SUPABASE_SECRET_KEY` является server-only секретом и никогда не должен иметь префикс `VITE_`.

## Gemini

Создайте бесплатный ключ в Google AI Studio и добавьте в Vercel:

```text
GEMINI_API_KEY
GEMINI_MODEL=gemini-3.5-flash
```

Модель можно заменить через environment variable без изменения кода.

## Meta Threads API

1. Создайте Meta App с Threads API.
2. Добавьте OAuth Redirect URI:

```text
https://threadssmm.vercel.app/api/threads/callback
```

3. Добавьте в Vercel:

```text
THREADS_APP_ID
THREADS_APP_SECRET
THREADS_REDIRECT_URI=https://threadssmm.vercel.app/api/threads/callback
TOKEN_ENCRYPTION_KEY
CRON_SECRET
```

Для `TOKEN_ENCRYPTION_KEY` и `CRON_SECRET` используйте независимые случайные строки минимум 32 байта. Токены Threads шифруются AES-256-GCM и хранятся в `private.threads_tokens`; доступ к ним есть только через RPC для `service_role`.

Vercel Hobby запускает cron один раз в день и не гарантирует точную минуту. Для точной публикации используйте кнопку «Опубликовать сейчас»; cron служит страховкой для просроченных scheduled-постов.

## Проверка

```bash
npx playwright install chromium
npm run verify
npm audit --omit=dev
```

`verify` запускает ESLint, TypeScript, demo production build и Playwright-тесты для desktop/mobile сценариев и overflow-regression AI Studio.
