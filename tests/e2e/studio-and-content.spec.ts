import { expect, test, type Page } from '@playwright/test'

function collectRuntimeErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  return errors
}

test('intent engine displays pipeline slots and hidden prompt', async ({ page }) => {
  const errors = collectRuntimeErrors(page)
  await page.goto('/app/studio')
  await page.getByRole('textbox').fill('сделай экспертный пост про AI-аудит для малого бизнеса')
  const gist = page.getByText(/Пост|Тред|Ответ/)
  await expect(gist).toBeVisible()
  await page.getByRole('button', { name: 'Показать промпт' }).click()
  await expect(page.getByText('Сформированный промпт для AI')).toBeVisible()
  expect(errors).toEqual([])
})

test('content factory presets appear in the preset modal', async ({ page }) => {
  const errors = collectRuntimeErrors(page)
  await page.goto('/app/studio')
  await page.getByRole('button', { name: 'Быстрые сценарии' }).click()
  await expect(page.getByRole('dialog', { name: 'Что будем создавать?' })).toBeVisible()
  await expect(page.getByText('Фабрика контента')).toBeVisible()
  await expect(page.getByText('Экспертный пост')).toBeVisible()
  expect(errors).toEqual([])
})

test('ThreadsPost preview renders inside studio variant cards', async ({ page }) => {
  const errors = collectRuntimeErrors(page)
  await page.goto('/app/studio')
  await page.getByRole('textbox').fill('создай пост про автоматизацию')
  await page.getByRole('button', { name: 'Сгенерировать' }).click()
  await expect(page.getByText('Созданы 3 варианта')).toBeVisible()
  const summary = page.locator('.threads-preview-toggle summary')
  await summary.first().click()
  await expect(page.locator('.threads-post')).toBeVisible()
  expect(errors).toEqual([])
})

test('audience segments page shows empty state and creates new segment', async ({ page }) => {
  const errors = collectRuntimeErrors(page)
  await page.goto('/app/audience-segments')
  await expect(page.getByText('Нет сегментов')).toBeVisible()
  expect(errors).toEqual([])
})

test('locations page shows empty state', async ({ page }) => {
  const errors = collectRuntimeErrors(page)
  await page.goto('/app/locations')
  await expect(page.getByText('Нет локаций')).toBeVisible()
  expect(errors).toEqual([])
})

test('team page loads with demo members', async ({ page }) => {
  const errors = collectRuntimeErrors(page)
  await page.goto('/app/team')
  await expect(page.getByText('Участники команды')).toBeVisible()
  expect(errors).toEqual([])
})
