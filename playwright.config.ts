/**
 * Playwright E2E Test Configuration
 *
 * Comprehensive E2E tests simulating real user behavior across the CineConnect app.
 */

import { defineConfig, devices } from '@playwright/test';

// Default URLs for dev environment
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
