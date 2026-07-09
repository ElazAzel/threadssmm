import { it, expect, vi, beforeEach } from 'vitest'

beforeEach(() => {
  vi.unstubAllEnvs()
})

it('detects demo mode from VITE_DEMO_MODE', async () => {
  vi.stubEnv('VITE_DEMO_MODE', 'true')
  vi.resetModules()
  const { demoMode } = await import('../../src/lib/env')
  expect(demoMode).toBe(true)
})

it('detects non-demo mode', async () => {
  vi.stubEnv('VITE_DEMO_MODE', 'false')
  vi.resetModules()
  const { demoMode } = await import('../../src/lib/env')
  expect(demoMode).toBe(false)
})

it('isSupabaseConfigured is false when vars are empty', async () => {
  vi.stubEnv('VITE_SUPABASE_URL', '')
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '')
  vi.resetModules()
  const { isSupabaseConfigured } = await import('../../src/lib/env')
  expect(isSupabaseConfigured).toBe(false)
})

it('isSupabaseConfigured is true when vars are set', async () => {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://example.com')
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'key123')
  vi.resetModules()
  const { isSupabaseConfigured } = await import('../../src/lib/env')
  expect(isSupabaseConfigured).toBe(true)
})