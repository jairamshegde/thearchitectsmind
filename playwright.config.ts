import { defineConfig, devices } from '@playwright/test';
import { SITE } from './src/site.config';

const origin = 'http://localhost:4321';
const baseURL = new URL(SITE.base.replace(/\/?$/, '/'), origin).href;

export default defineConfig({
  testDir: 'tests/e2e',
  use: { baseURL },
  // Astro 7 `preview` detaches when not attached to a terminal; follow its logs to keep the
  // web server process alive, and stop the detached server in globalTeardown.
  webServer: {
    command: 'npx astro preview --port 4321 && npx astro preview logs --follow',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
  globalTeardown: './tests/e2e/teardown.ts',
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], permissions: ['clipboard-read', 'clipboard-write'] } },
  ],
});
