# Services overview and service pages (#128)

Local run on `sde2/128-services-pages`, production build served by `astro preview`.

## UX review fixes (2026-11-06)

The service overview stages and detail galleries now use one column below 48rem.
Their HTML qualification captions stay in normal flow, keeping the existing pill
tokens while allowing each card to grow with enlarged text. Wider layouts retain
the staggered overview and three-column detail gallery. These overrides are scoped
to the service pages; the shared component and home page are unchanged.

The AI gallery uses its existing descriptive caption as its accessible name; only
the scripted demo uses the demo heading. No new visitor-facing copy was added.

Regression proof: before the fix, the new checks failed on the original build
(`005e7632b33f`): the overview caption started about 225 px above its card at
320 px / 200% text, and the AI demo heading named two regions instead of one.
The reflow checks compare both the caption box and its actual text range against
all four card edges at 100% and 200% text on all five service routes, at 320, 768
and 1280 px. They also retain document overflow, axe, keyboard, reduced-motion
and no-JavaScript checks.

Verification on the fixed production build:

- `npm run lint`: passed.
- `npm run check`: 0 errors, warnings or hints; TypeScript passed.
- `npm run build`: 13 pages.
- `npm test`: 183 passed, including the dist image, CSS, script and CSP checks.
- `PORT=4411 npm run test:e2e`: 108 passed, including all 21 service tests.

The first unit run overlapped the build and read temporary unoptimized images;
it also hit a lint-fixture timeout under load. The isolated run against the
completed artifact passed without changes to code or test timeouts.

### Updated Lighthouse (mobile, median of three runs)

All assertions passed for the five service URLs (15 runs). The run used the
repository's Lighthouse configuration and budgets, filtered to `/services/`.
Because chrome-launcher's WSL temporary directory was read-only, Lighthouse
connected to a Playwright-managed Linux Chromium via port 9222; Astro preview
used port 4411. The browser and preview were stopped after the run.

| Page | Perf | A11y | BP | SEO | LCP ms | CLS | TBT ms |
|---|---|---|---|---|---|---|---|
| /services/ | 100 | 100 | 100 | 100 | 1515 | 0.008 | 0 |
| /services/expert-support/ | 100 | 100 | 100 | 100 | 1440 | 0.000 | 0 |
| /services/ai-automation/ | 100 | 100 | 100 | 100 | 1292 | 0.000 | 0 |
| /services/website-creation/ | 100 | 100 | 100 | 100 | 1376 | 0.000 | 0 |
| /services/solutions/ | 100 | 100 | 100 | 100 | 1362 | 0.000 | 0 |

### Updated screenshots

Production-build gallery crops, reduced motion, images decoded before capture:

| Page | 320 px, 100% text | 320 px, 200% text | 1280 px, 100% text |
|---|---|---|---|
| Overview (expert stage) | [View](128-reflow-overview-320-100.jpg) | [View](128-reflow-overview-320-200.jpg) | [View](128-reflow-overview-1280-100.jpg) |
| Expert support | [View](128-reflow-expert-320-100.jpg) | [View](128-reflow-expert-320-200.jpg) | [View](128-reflow-expert-1280-100.jpg) |
| AI automation | [View](128-reflow-automation-320-100.jpg) | [View](128-reflow-automation-320-200.jpg) | [View](128-reflow-automation-1280-100.jpg) |

The original full-page screenshots and scores below record the earlier build.

## Lighthouse (mobile, `npm run test:lighthouse`, 3 runs per page, all assertions passed)

| Page | Perf | A11y | BP | SEO | LCP ms | CLS | TBT ms |
|---|---|---|---|---|---|---|---|
| /services/ | 100 | 100 | 96 | 100 | 1511 | 0.005 | 0 |
| /services/expert-support/ | 100 | 100 | 96 | 100 | 1451 | 0.000 | 0 |
| /services/ai-automation/ | 100 | 100 | 96 | 100 | 1532 | 0.000 | 0 |
| /services/website-creation/ | 100 | 100 | 96 | 100 | 1435 | 0.000 | 0 |
| /services/solutions/ | 100 | 100 | 96 | 100 | 1445 | 0.000 | 0 |

Lighthouse does not scroll, so its page weights leave out lazy images. `npm run test:dist` checks
each page's full weight, images included, against the NFR §1.1 budgets.

## Screenshots (reduced motion, so the marquee is in its stopped layout)

- Overview: [320 px](128-services-overview-320.jpg), [1280 px](128-services-overview-1280.jpg)
- Expert support: [320 px](128-services-expert-320.jpg), [1280 px](128-services-expert-1280.jpg)
- AI automation: [320 px](128-services-automation-320.jpg), [1280 px](128-services-automation-1280.jpg)
