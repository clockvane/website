/* Lighthouse CI config (docs/qa/test-strategy.md §6, NFR L-1..L-4).
   Run with `npm run test:lighthouse`; the port comes from PORT. */
// Lighthouse CI loads this file with require(), so it must stay CommonJS.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { existsSync } = require('node:fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { chromium } = require('@playwright/test');

const port = Number(process.env.PORT) || 4411;
// In WSL, chrome-launcher finds the Windows Chrome and cannot connect to it ("Unable to connect to
// Chrome"). Use Playwright's Linux Chromium (installed for the e2e suite) unless CHROME_PATH is set.
// Where Playwright's browser isn't installed (for example a CI runner with its own Chrome), let
// chrome-launcher find Chrome as before.
const playwrightChromium = chromium.executablePath();
const chromePath =
  process.env.CHROME_PATH ||
  (existsSync(playwrightChromium) ? playwrightChromium : undefined);
// Page PRs add their path here.
const paths = [
  '/',
  '/about/',
  '/how-we-work/',
  '/contact/',
  '/privacy/',
  '/services/',
  '/services/process-automation/',
  '/services/ai-automation/',
  '/services/ai-cost-optimization/',
  '/services/cloud-devops/',
  '/services/websites-and-apps/',
  '/services/custom-software/',
];

module.exports = {
  ci: {
    collect: {
      startServerCommand: `npm run preview -- --port ${port} --ignore-lock`,
      startServerReadyPattern: 'astro.*started|Local',
      url: paths.map((p) => `http://127.0.0.1:${port}${p}`),
      numberOfRuns: 3,
      chromePath,
      settings: {
        chromeFlags: '--headless=new --no-sandbox',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.95 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.95 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.05 }],
        'total-blocking-time': ['error', { maxNumericValue: 150 }],
      },
    },
    upload: { target: 'filesystem', outputDir: '.lighthouseci' },
  },
};
