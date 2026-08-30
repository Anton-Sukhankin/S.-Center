import { defineConfig } from '@playwright/test';

const localBrowserChannel = process.env.PLAYWRIGHT_CHANNEL
  || (process.platform === 'win32' ? 'msedge' : undefined);

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['line']],
  use: {
    baseURL: 'http://127.0.0.1:4185/s-center-prototype/',
    browserName: 'chromium',
    channel: localBrowserChannel,
    headless: true,
    viewport: { width: 1600, height: 900 },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node scripts/serve.mjs',
    url: 'http://127.0.0.1:4185/s-center-prototype/',
    reuseExistingServer: true,
    timeout: 15_000,
  },
});
