import { defineConfig, devices } from '@playwright/test'

const PORT = 8766

// Smoke tests of the built bundle on the demo pages: run `npm run build` first.
export default defineConfig({
  testDir: 'e2e',
  testMatch: '*.e2e.ts', // not *.test.ts or *.spec.ts: those are picked up by Vitest
  forbidOnly: !!process.env.CI,
  use: { baseURL: `http://localhost:${PORT}` },
  webServer: {
    command: `node e2e/serve.mjs ${PORT}`,
    url: `http://localhost:${PORT}/demo/bare.html`,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
})
