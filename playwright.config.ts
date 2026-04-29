import { defineConfig } from '@playwright/test'
import { defineBddConfig } from 'playwright-bdd'

const bddConfig = defineBddConfig({
  features: 'specs/features/**/*.feature',
  steps: 'tests/bdd/steps/**/*.ts',
  outputDir: '.features-gen',
})

export default defineConfig({
  use: {
    baseURL: 'http://127.0.0.1:4173',
    headless: true,
  },
  webServer: {
    command: 'pnpm dev --host 127.0.0.1 --port 4173',
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'bdd',
      testDir: bddConfig.outputDir,
    },
    {
      name: 'e2e-legacy',
      testDir: './e2e',
    },
  ],
})
