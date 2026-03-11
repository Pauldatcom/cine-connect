/** Playwright E2E config. Loads backend/.env (E2E_TEST_PASSWORD for chat + user-public-profile specs). */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const envPath = join(process.cwd(), 'backend', '.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const m = t.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) {
      const value = m[2].replace(/^["']|["']$/g, '').trim();
      if (process.env[m[1]] === undefined) process.env[m[1]] = value;
    }
  }
}

import { defineConfig, devices } from '@playwright/test';

// Local dev defaults; set in CI. Do not commit real credentials.
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

export default defineConfig({
  // Test directory
  testDir: './e2e',

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry failed tests on CI
  retries: process.env.CI ? 2 : 0,

  // CI: 1 worker for stability. Local: max 2 to avoid overloading dev servers
  workers: process.env.CI ? 1 : 2,

  // Reporter configuration
  reporter: [['html', { outputFolder: 'e2e-report' }], ['list']],

  // Shared settings for all projects
  use: {
    // Base URL for frontend
    baseURL: FRONTEND_URL,

    // Collect trace on failure for debugging
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video recording on failure
    video: 'on-first-retry',

    // Set viewport size
    viewport: { width: 1280, height: 720 },
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Run local dev server before starting tests
  // Set SKIP_WEBSERVER=true if you already have servers running
  webServer:
    process.env.CI || process.env.SKIP_WEBSERVER
      ? undefined
      : [
          {
            command: 'pnpm dev:backend',
            url: `${BACKEND_URL}/health`,
            reuseExistingServer: true,
            timeout: 120000,
            env: { ...process.env, E2E: '1' },
          },
          {
            command: 'pnpm dev:frontend',
            url: FRONTEND_URL,
            reuseExistingServer: true,
            timeout: 120000,
          },
        ],

  // Global timeout
  timeout: 30000,

  // Expect timeout
  expect: {
    timeout: 5000,
  },
});
