import { expect, test, type Page } from '@playwright/test'

function collectRuntimeErrors(page: Page) {
  const errors: string[] = []

  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })

  return errors
}

test('landing and direct SPA routes render without runtime errors', async ({ page }) => {
  const errors = collectRuntimeErrors(page)

  await page.goto('/')
  await expect(page.getByRole('heading', { name: /AI SMM-агент/ })).toBeVisible()

  await page.goto('/app/dashboard')
  await expect(page.locator('.desktop-dashboard').getByText('Действия на сегодня', { exact: true })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Основная навигация' })).toBeVisible()

  expect(errors).toEqual([])
})

test('setup screen shows production readiness checklist', async ({ page }) => {
  const errors = collectRuntimeErrors(page)

  await page.goto('/setup')
  await expect(page.getByRole('heading', { name: 'Требуется подключить production окружение' })).toBeVisible()
  const status = page.getByLabel('Статус окружения')
  await expect(status.getByText('Frontend Supabase')).toBeVisible()
  await expect(status.getByText('Server functions')).toBeVisible()
  await expect(status.getByText('VITE_SUPABASE_URL', { exact: true })).toBeVisible()
  await expect(status.getByText('Gemini AI')).toBeVisible()

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(1)
  expect(errors).toEqual([])
})

test('content can be generated, reviewed and approved', async ({ page }) => {
  const errors = collectRuntimeErrors(page)

  await page.goto('/app/studio')
  await page.getByLabel('Основная мысль').fill('Объяснить преимущества системного контент-плана')
  await page.getByRole('button', { name: 'Создать варианты', exact: true }).click()
  await expect(page.getByText('Созданы 3 варианта в голосе бренда')).toBeVisible()

  const variantB = page.locator('.variant-card').filter({ hasText: 'Вариант B' })
  await variantB.getByRole('button', { name: 'Согласовать', exact: true }).click()
  await expect(page).toHaveURL(/\/app\/approvals$/)

  await page.getByRole('button', { name: 'Редактировать' }).click()
  await page.getByRole('dialog', { name: 'Редактировать публикацию' }).getByLabel('Текст').fill('Системный контент даёт команде предсказуемый ритм и понятный процесс проверки.')
  await page.getByRole('dialog', { name: 'Редактировать публикацию' }).getByRole('button', { name: 'Сохранить' }).click()
  await expect(page.getByText('Системный контент даёт команде предсказуемый ритм')).toBeVisible()

  await page.getByRole('button', { name: 'Исправить риск' }).click()
  await expect(page.getByText(/стандартное AES-256 шифрование/)).toBeVisible()
  await page.getByRole('button', { name: 'Согласовать и запланировать' }).click()
  await expect(page.getByRole('heading', { name: 'Публикация согласована' })).toBeVisible()

  expect(errors).toEqual([])
})

test('global search, notifications and AI history respond to user actions', async ({ page }) => {
  const errors = collectRuntimeErrors(page)

  await page.goto('/app/dashboard')
  await page.getByRole('textbox', { name: 'Поиск' }).fill('TechNova')
  await expect(page.getByRole('listbox', { name: 'Результаты поиска' }).getByText('Профиль бренда')).toBeVisible()
  await page.getByRole('listbox', { name: 'Результаты поиска' }).getByRole('button').first().click()
  await expect(page).toHaveURL(/\/app\/brands$/)

  await page.getByRole('button', { name: 'Уведомления' }).click()
  await expect(page.getByRole('dialog', { name: 'Уведомления' }).getByText('Новых уведомлений нет')).toBeVisible()
  await page.getByRole('dialog', { name: 'Уведомления' }).getByRole('button', { name: 'Закрыть' }).click()

  await page.goto('/app/studio')
  await page.locator('.variant-card').filter({ hasText: 'Вариант A' }).getByRole('button', { name: 'Сохранить', exact: true }).click()
  await page.getByRole('button', { name: 'История' }).click()
  await expect(page.getByRole('dialog', { name: 'История AI Studio' }).locator('.history-list > button')).toHaveCount(1)

  expect(errors).toEqual([])
})

test('workspace policies persist and calendar modes change the rendered view', async ({ page }) => {
  const errors = collectRuntimeErrors(page)

  await page.goto('/app/settings')
  await page.getByRole('button', { name: 'Безопасность' }).click()
  const settings = page.locator('.settings-placeholder')
  await settings.getByRole('checkbox').uncheck()
  await settings.getByRole('combobox').selectOption('strict')
  await settings.getByRole('button', { name: 'Сохранить' }).click()
  await expect(page.getByText('Настройки сохранены')).toBeVisible()
  await page.getByRole('button', { name: 'AI-провайдеры' }).click()
  await page.getByRole('button', { name: 'Безопасность' }).click()
  await expect(settings.getByRole('checkbox')).not.toBeChecked()
  await expect(settings.getByRole('combobox')).toHaveValue('strict')

  await page.goto('/app/calendar')
  await page.getByRole('button', { name: 'Список', exact: true }).click()
  await expect(page.locator('.calendar-list-view')).toBeVisible()
  await page.getByRole('button', { name: 'Месяц', exact: true }).click()
  await expect(page.locator('.calendar-card')).toBeVisible()

  expect(errors).toEqual([])
})

test('manual Threads profiles can be added, assigned and removed', async ({ page }) => {
  const errors = collectRuntimeErrors(page)

  await page.goto('/app/accounts')
  await page.getByRole('button', { name: 'Ручной профиль' }).click()
  await page.getByRole('dialog', { name: 'Добавить Threads-профиль' }).getByLabel('Username').fill('@test_profile')
  await page.getByRole('dialog', { name: 'Добавить Threads-профиль' }).getByRole('button', { name: 'Добавить' }).click()
  await expect(page.getByRole('heading', { name: '@test_profile' })).toBeVisible()
  await page.getByLabel('Связанный бренд').selectOption({ label: 'TechNova' })
  await page.getByRole('button', { name: 'Удалить' }).click()
  await page.getByRole('dialog', { name: 'Удалить профиль' }).getByRole('button', { name: 'Удалить' }).click()
  await expect(page.getByRole('heading', { name: '@test_profile' })).toHaveCount(0)

  expect(errors).toEqual([])
})

test('key screens fit a mobile viewport without horizontal overflow', async ({ page }) => {
  const errors = collectRuntimeErrors(page)
  await page.setViewportSize({ width: 390, height: 844 })

  const routes = [
    '/',
    '/setup',
    '/app/dashboard',
    '/app/accounts',
    '/app/brands',
    '/app/studio',
    '/app/calendar',
    '/app/monitoring',
    '/app/approvals',
    '/app/analytics',
    '/app/media',
    '/app/billing',
    '/app/settings',
  ]

  for (const route of routes) {
    await page.goto(route)
    await expect(page.locator('body')).toBeVisible()

    if (route.startsWith('/app/')) {
      await expect(page.getByRole('navigation', { name: 'Мобильная навигация' })).toBeVisible()
    }

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow, `Horizontal overflow on ${route}`).toBeLessThanOrEqual(1)
  }

  expect(errors).toEqual([])
})

test('AI Studio remains inside the viewport at desktop zoom breakpoints', async ({ page }) => {
  const errors = collectRuntimeErrors(page)

  for (const width of [1920, 1280, 1100]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/app/studio')
    await expect(page.locator('.variant-grid')).toBeVisible()

    const layout = await page.evaluate(() => {
      const cards = [...document.querySelectorAll<HTMLElement>('.variant-card')]
      return {
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        cardsOutsideViewport: cards.filter((card) => {
          const box = card.getBoundingClientRect()
          return box.left < 0 || box.right > window.innerWidth + 1
        }).length,
        actionOverflow: [...document.querySelectorAll<HTMLElement>('.variant-card .split-actions')]
          .some((actions) => actions.scrollWidth > actions.clientWidth + 1),
      }
    })

    expect(layout.overflow, `Horizontal overflow at ${width}px`).toBeLessThanOrEqual(1)
    expect(layout.cardsOutsideViewport, `Cards outside viewport at ${width}px`).toBe(0)
    expect(layout.actionOverflow, `Card actions overflow at ${width}px`).toBe(false)
  }

  expect(errors).toEqual([])
})

test('dashboard remains inside the viewport with the desktop sidebar', async ({ page }) => {
  const errors = collectRuntimeErrors(page)

  for (const width of [1440, 1280, 1100]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/app/dashboard')
    await expect(page.locator('.desktop-dashboard')).toBeVisible()

    const layout = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      cardsOutsideViewport: [...document.querySelectorAll<HTMLElement>('.desktop-dashboard .card')]
        .filter((card) => card.getBoundingClientRect().right > window.innerWidth + 1).length,
    }))

    expect(layout.overflow, `Dashboard horizontal overflow at ${width}px`).toBeLessThanOrEqual(1)
    expect(layout.cardsOutsideViewport, `Dashboard cards outside viewport at ${width}px`).toBe(0)
  }

  expect(errors).toEqual([])
})

test('calendar remains inside desktop viewport across sidebar breakpoints', async ({ page }) => {
  const errors = collectRuntimeErrors(page)

  for (const width of [1440, 1280, 1100]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/app/calendar')
    await expect(page.locator('.calendar-layout')).toBeVisible()

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow, `Calendar horizontal overflow at ${width}px`).toBeLessThanOrEqual(1)
  }

  expect(errors).toEqual([])
})
