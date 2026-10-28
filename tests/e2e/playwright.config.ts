import { defineConfig } from '@playwright/test';
import process from 'node:process';

const port = Number(process.env.PORT) || 4411;
export default defineConfig({
  testDir: '.',
  testIgnore: 'components.spec.ts',
  workers: 1,
  use: { baseURL: `http://127.0.0.1:${port}`, browserName: 'chromium' },
  webServer: {
    command: `npm run preview -- --port ${port} --ignore-lock`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
  },
});
