# Issue #127 — home page verification

Verified locally on 2026-11-05 against a production build of `sde2/127-home-page`.

| Check | Result |
|-------|--------|
| `npm run lint` | Clean |
| `npm run check` | 0 errors, 0 warnings, 0 hints |
| `npm test` | 161 passed in 17 files |
| `npm run test:dist` | 36 passed, including P-4 script and P-8 page weight for `/` |
| `npm run test:e2e` | 67 passed (axe, keyboard, 320 px reflow, reduced motion, no JavaScript) |
| `npm run test:components` | 15 passed |

## Lighthouse (mobile, local run; three runs per page)

| Page | Perf | A11y | BP | SEO | LCP ms | CLS | TBT ms | JS kB | Total kB |
|------|------|------|----|-----|--------|-----|--------|-------|----------|
| `/` | 99 | 100 | 96 | 100 | 1617 | 0.000 | 0 | 2.3 | 125.3 |

The total counts what loads on first view; example screens below the fold are lazy. With every visible
image loaded, images weigh 96 kB at 320 px (20 images) and 222 kB at 1440 px (31 images).

## Screenshots

Taken with reduced motion, which shows the stopped marquee layout, and with every visible image decoded.

- [320 px](127-home-320.jpg)
- [1440 px](127-home-1440.jpg)
