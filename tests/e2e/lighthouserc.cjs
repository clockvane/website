/* Lighthouse CI config (docs/qa/test-strategy.md §6, NFR L-1..L-4).
   Run with `npm run test:lighthouse`; the port comes from PORT. */
// Lighthouse CI loads this file with require(), so it must stay CommonJS.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { existsSync } = require('node:fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { chromium } = require('@playwright/test');

// LH_PRESET=desktop runs the desktop preset (same pages, same NFR assertions; #155).
const desktop = process.env.LH_PRESET === 'desktop';
const port = Number(process.env.PORT) || 4411;
// BASE_URL (deploy-staging.yml) audits an already deployed site instead of a local server.
const remote = (process.env.BASE_URL || '').replace(/\/$/, '');
const origin = remote || `http://127.0.0.1:${port}`;
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
  '/services/expert-support/',
  '/services/ai-automation/',
  '/services/website-creation/',
  '/services/solutions/',
];

module.exports = {
  ci: {
    collect: {
      ...(remote
        ? {}
        : {
            startServerCommand: `npm run preview -- --port ${port} --ignore-lock`,
            startServerReadyPattern: 'astro.*started|Local',
          }),
      url: paths.map((p) => `${origin}${p}`),
      numberOfRuns: 3,
      chromePath,
      settings: {
        ...(desktop ? { preset: 'desktop' } : {}),
        chromeFlags: '--headless=new --no-sandbox',
        // Staging is deliberately noindex (header + robots.txt, ADR-002), which would fail this
        // audit by design. Production is audited with it on.
        ...(remote ? { skipAudits: ['is-crawlable'] } : {}),
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
        // NFR §1.1 budgets (P-6, P-7, P-8, P-9).
        'resource-summary:total:size': ['error', { maxNumericValue: 1500000 }],
        'resource-summary:total:count': ['error', { maxNumericValue: 40 }],
        'resource-summary:font:size': ['error', { maxNumericValue: 120000 }],
        'unsized-images': 'error',
        'modern-image-formats': 'error',
        'uses-responsive-images': 'warn',
        'offscreen-images': 'warn',
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: desktop ? '.lighthouseci/desktop' : '.lighthouseci',
    },
  },
};
