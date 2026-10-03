import { defineConfig, devices } from '@playwright/test';
import { SITE } from './src/site.config';

// Own port, so a running `astro dev` (4321) is never mistaken for the built site.
const origin = 'http://localhost:4322';
const baseURL = new URL(SITE.base.replace(/\/?$/, '/'), origin).href;

export default defineConfig({
  testDir: 'tests/e2e',
  use: { baseURL },
  // Astro 7 `preview` detaches when not attached to a terminal; follow its logs to keep the
  // web server process alive, and stop the detached server in globalTeardown.
  webServer: {
    command: 'npx astro preview --port 4322 && npx astro preview logs --follow',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
  globalTeardown: './tests/e2e/teardown.ts',
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], permissions: ['clipboard-read', 'clipboard-write'] } },
  ],
});
