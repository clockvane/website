# Lighthouse evidence: design system v2 (#88, PR #93)

Acceptance criterion 5 of #88: Lighthouse mobile ≥ 95, with JS, CSS, font and page sizes per page.

**Source:** `sde3` measured this on commit `410b0d6` and reported it in PR #93
([comment of 2026-10-29 23:58 UTC](https://github.com/clockvane/website/pull/93#issuecomment-6511406862)).
Settings: `npm run test:lighthouse` (Lighthouse CI, default mobile emulation), production build, 3 runs per
page. All assertions in `tests/e2e/lighthouserc.cjs` passed: performance, accessibility, best practices and
SEO ≥ 0.95; LCP ≤ 2000 ms; CLS ≤ 0.05; TBT ≤ 150 ms. This file records those results so reviewers can
check them against a fresh run.

Later commits do not change the existing pages' payload; no page opts into the motion controller yet.

| Page | Perf | A11y | BP | SEO | LCP ms | CLS | TBT |
|---|---|---|---|---|---|---|---|
| / | 100 | 100 | 96 | 100 | 1206 | 0 | 0 |
| /about/ | 100 | 100 | 96 | 100 | 1357 | 0 | 0 |
| /how-we-work/ | 100 | 100 | 96 | 100 | 1356 | 0 | 0 |
| /contact/ | 100 | 100 | 96 | 100 | 1209 | 0 | 0 |
| /privacy/ | 100 | 100 | 96 | 100 | 1205 | 0 | 0 |

Transfer size per page (bytes), against the limits in PRD 7.2 and ADR-004 (JS ≤ 35 kB, CSS ≤ 40 kB,
fonts ≤ 120 kB, page ≤ 600 kB):

| Page | HTML | CSS | JS | Font | Total |
|---|---|---|---|---|---|
| / | 1,656 | 3,400 | 0 | 27,152 | 32,208 |
| /about/ | 2,459 | 5,192 | 0 | 27,152 | 34,803 |
| /how-we-work/ | 2,812 | 5,562 | 0 | 27,152 | 35,526 |
| /contact/ | 2,811 | 5,082 | 7,785 | 27,152 | 42,830 |
| /privacy/ | 2,343 | 4,522 | 0 | 27,152 | 34,017 |

## Reproduce

```bash
npm run build
PORT=4411 npm run test:lighthouse
```

`tests/e2e/lighthouserc.cjs` now uses Playwright's Linux Chromium unless `CHROME_PATH` is set, so the run
also works in WSL. Before this change, chrome-launcher found the Windows Chrome and failed with "Unable to
connect to Chrome". CI does not run Lighthouse yet; that is a separate workflow change.
