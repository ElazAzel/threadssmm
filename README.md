# Threads SMM Agent

Интерактивный frontend-прототип SaaS-платформы для управления Threads-контентом: стратегия бренда, AI Studio, согласование, календарь, мониторинг, аналитика и лимиты.

Production: [threadssmm.vercel.app](https://threadssmm.vercel.app)

## Локальный запуск

```bash
npm install
npm run dev
```

Проверка перед публикацией:

```bash
npx playwright install chromium
npm run verify
```

`verify` запускает ESLint, production build и Playwright smoke-тесты для desktop/mobile сценариев.

## Vercel через GitHub

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`
- Node.js: `24.x` или совместимая актуальная версия

`vercel.json` уже содержит SPA rewrite для прямого открытия маршрутов `/app/*`.

GitHub Actions workflow `.github/workflows/ci.yml` выполняет те же проверки при каждом push в `main` и в pull request.

Проект Vercel связан с репозиторием `ElazAzel/threadssmm`: изменения в `main` автоматически публикуются в production после push.

## Текущее состояние

Это frontend MVP с демонстрационными данными и локальными интерактивными сценариями. Реальные OAuth, Threads API, AI-провайдеры, база данных, биллинг и защищённое хранение ключей должны подключаться через серверный слой; секреты нельзя переносить в клиентский код.
