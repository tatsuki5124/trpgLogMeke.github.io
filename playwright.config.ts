import { defineConfig } from '@playwright/test'
import { defineBddConfig } from 'playwright-bdd'

const bddTestDir = defineBddConfig({
  features: 'specs/features/**/*.feature',
  steps: 'tests/bdd/steps/**/*.ts',
  outputDir: '.features-gen',
})

export default defineConfig({
  use: {
    baseURL: 'http://127.0.0.1:4173',
    headless: true,
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_BROWSERS_PATH
        ? '/opt/pw-browsers/chromium'
        : undefined,
    },
  },
  webServer: {
    command: 'pnpm dev --host 127.0.0.1 --port 4173',
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'bdd',
      testDir: bddTestDir,
    },
    {
      name: 'e2e-legacy',
      testDir: './e2e',
    },
  ],
})
