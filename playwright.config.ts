import fs from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const useSystemChrome = !process.env.CI && fs.existsSync(chromePath);
const port = Number(process.env.PW_PORT || 4173);

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: /.*\.e2e\.ts/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    ...(useSystemChrome ? { channel: 'chrome' } : {})
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } }
    },
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 5'], viewport: { width: 390, height: 844 } }
    }
  ],
  webServer: {
    command: `node scripts/serve-production-preview.mjs`,
    url: `http://127.0.0.1:${port}/`,
    reuseExistingServer: !process.env.CI,
    env: {
      PREVIEW_PORT: String(port),
      NODE_ENV: 'test',
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'playwright-only-test-password-2026!',
      SECURITY_HMAC_KEY:
        process.env.SECURITY_HMAC_KEY ||
        'playwright-only-test-hmac-key-never-use-in-prod-32bytes'
    }
  }
});
