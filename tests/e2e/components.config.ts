import { defineConfig } from '@playwright/test';
import base from './playwright.config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  ...base,
  testMatch: 'components.spec.ts',
  testIgnore: [],
  webServer: {
    ...base.webServer,
    cwd: fileURLToPath(new URL('../..', import.meta.url)),
    command: 'node tests/e2e/preview-components.mjs',
    timeout: 120000,
  },
});
