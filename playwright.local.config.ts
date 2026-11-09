import { defineConfig, devices } from '@playwright/test'
export default defineConfig({
  testDir: './tests/local-e2e', fullyParallel: true,
  forbidOnly: Boolean(process.env.CI), retries: process.env.CI ? 1 : 0, workers: 2,
  use: { baseURL: 'http://127.0.0.1:4174', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [{ name: 'local-chromium', use: { ...devices['Desktop Chrome'], launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined } } }],
  webServer: { command: 'node server/local-assistant.mjs', url: 'http://127.0.0.1:4174', reuseExistingServer: false, timeout: 30_000 },
})
