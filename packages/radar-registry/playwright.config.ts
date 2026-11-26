import { defineConfig, devices } from '@playwright/test'

const PORT = 8767

// Smoke tests of the built bundle on the demo page: run `npm run build` first.
export default defineConfig({
  testDir: 'e2e',
  testMatch: '*.e2e.ts',
  forbidOnly: !!process.env.CI,
  use: { baseURL: `http://localhost:${PORT}` },
  webServer: {
    // deploy-map's static server, serving this package's folder.
    command: `node ../deploy-map/e2e/serve.mjs ${PORT} .`,
    url: `http://localhost:${PORT}/demo/index.html`,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
})
