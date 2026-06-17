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

  await page.getByRole('button', { name: 'Исправить риск' }).click()
  await expect(page.getByText(/стандартное AES-256 шифрование/)).toBeVisible()
  await page.getByRole('button', { name: 'Согласовать и запланировать' }).click()
  await expect(page.getByRole('heading', { name: 'Публикация согласована' })).toBeVisible()

  expect(errors).toEqual([])
})

test('key screens fit a mobile viewport without horizontal overflow', async ({ page }) => {
  const errors = collectRuntimeErrors(page)
  await page.setViewportSize({ width: 390, height: 844 })

  const routes = [
    '/',
    '/setup',
    '/app/dashboard',
    '/app/studio',
    '/app/calendar',
    '/app/approvals',
    '/app/media',
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
