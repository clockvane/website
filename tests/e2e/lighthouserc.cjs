/* Lighthouse CI config (docs/qa/test-strategy.md §6, NFR L-1..L-4).
   Run with `npm run test:lighthouse`; the port comes from PORT. */
const port = Number(process.env.PORT) || 4411;
// Page PRs add their path here.
const paths = ['/', '/about/', '/how-we-work/', '/contact/', '/privacy/'];

module.exports = {
  ci: {
    collect: {
      startServerCommand: `npm run preview -- --port ${port} --ignore-lock`,
      startServerReadyPattern: 'astro.*started|Local',
      url: paths.map((p) => `http://127.0.0.1:${port}${p}`),
      numberOfRuns: 3,
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
