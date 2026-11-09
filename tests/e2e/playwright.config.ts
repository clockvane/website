import { defineConfig } from '@playwright/test';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const port = Number(process.env.PORT) || 4411;
export default defineConfig({
  testDir: '.',
  testIgnore: ['components.spec.ts', 'design-system.spec.ts'],
  workers: 1,
  outputDir: path.join(root, 'test-results'),
  reporter: [
    ['list'],
    [
      'html',
      { open: 'never', outputFolder: path.join(root, 'playwright-report') },
    ],
  ],
  use: { baseURL: `http://127.0.0.1:${port}`, browserName: 'chromium' },
  webServer: {
    command: `npm run preview -- --port ${port} --ignore-lock`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
  },
});
