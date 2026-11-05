# Services overview and service pages (#128)

Local run on `sde2/128-services-pages`, production build served by `astro preview`.

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
