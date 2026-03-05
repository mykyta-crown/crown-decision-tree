import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'

// Charger variables d'environnement
dotenv.config({ path: '.env.test' })

export default defineConfig({
  testDir: './tests/e2e',

  // Timeout configuration
  timeout: 30 * 1000, // 30s par test
  expect: {
    timeout: 5000 // 5s pour les assertions
  },

  // Retry and parallelization
  fullyParallel: true,
  forbidOnly: !!process.env.CI, // Interdit .only() en CI
  retries: process.env.CI ? 2 : 0, // 2 retry en CI, 0 en local
  workers: process.env.CI ? 1 : undefined, // 1 worker en CI, auto en local

  // Reporter
  reporter: [['html'], ['list'], ['json', { outputFile: 'test-results/results.json' }]],

  // Artifacts
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry', // Trace seulement sur retry
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Ralentir les actions en debug
    actionTimeout: 10000,
    navigationTimeout: 10000
  },

  // Projects (browsers)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
    // Note: On peut ajouter firefox/webkit plus tard si nécessaire
  ],

  // Dev server (optionnel - si tests lancés sans serveur démarré)
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000 // 2 minutes pour démarrer Nuxt
  }
})
