# V2 verification — issue #86

Measured 2026-10-29 against the current built pages with the new tokens. These checks protect the existing shell and journeys; they do **not** claim that #88/#58/#59's Concept C page layouts or motion have been implemented.

## Repository and browser checks

- `npm run lint`: pass.
- `npm run check` (Astro + strict TypeScript): zero errors/warnings/hints.
- `npm test`: 10 files, 64 tests pass; 100% line/function coverage.
- `npm run build`: pass, eight pages; existing generator and OG image work with v2 tokens.
- `node .agentops-scratch/contrast.mjs`: all 12 pairs pass; reusable committed check in `tests/unit/lib/design/tokens.test.ts`.
- Compared original/current token paths: 94 original, 147 current, zero removed. Concrete legacy palette mirrors preserve the OG consumer; semantic aliases resolve to dark roles.
- `npm run test:e2e`: 50 passed; two obsolete assertions expected every declared font, including unused Newsreader, to download. Updated only those assertions to require Public Sans loaded and exactly its one font request. `npx playwright test --config tests/e2e/playwright.config.ts layout.spec.ts`: all eight pass, including both corrected cases. No application code changed. Other 50 results remain applicable.
- Browser evidence covers keyboard/no-JS disclosures, native/JS form results and focus, axe, 44px targets, 320px reflow, 200% text and forced colors. New five-width layouts and motion fallbacks are implementation acceptance criteria, not claimed completed tests here.
- `git diff --check`: pass. No new dependency, no third-party request; preview port 4412 and browser closed after checks.

## Current build: mobile Lighthouse

Installed Lighthouse 12.6.1, Linux Chromium 156, mobile 412×823 DPR 1.75, simulated 150ms RTT / 1638.4kbps and 4× CPU slowdown. Three runs per route, one browser at a time. Each column below is the median of three. All nine runs scored 100 in every category; all passed the existing Lighthouse CI numeric limits, including the worst single LCP (1.227s) and TBT (8.323ms). Lab TBT is not field INP.

| Route | Performance / Accessibility / Best practices / SEO | LCP ms (three runs → median) | CLS median | TBT median |
|---|---|---|---:|---:|
| Home `/` (current shell) | 100 / 100 / 100 / 100 | 1083.354, 1068.626, 1056.402 → **1068.626** | 0 | 0ms |
| About | 100 / 100 / 100 / 100 | 1214.843, 1221.303, 1226.408 → **1221.303** | 0 | 0ms |
| How we work | 100 / 100 / 100 / 100 | 1216.996, 1211.763, 1212.437 → **1212.437** | 0 | 0ms |

`npm run test:lighthouse` could not launch its browser: WSL discovery tried to create a profile on the read-only Windows filesystem. The successful fallback used the installed Playwright Linux Chromium with a local profile, then `lighthouse(url, {port, output:'json'})` at its debugging port with default mobile settings and the same three configured routes/three runs. Session script/results/full JSON reports: `.agentops-scratch/lighthouse-v2.mjs`, `lh-v2-results.json`, `lh-v2-<route>-<run>.json`. No assertions were disabled; metrics above were checked against the config (categories ≥95, LCP ≤2000ms, CLS ≤.05, TBT ≤150ms). Reproduce on Linux with the normal LHCI command, or attach Lighthouse to an existing Linux Chromium in WSL. No new large report copies are committed, following PR #85 review feedback.

## Compressed CSS/JS

Gzip sums of unique external CSS/script resources referenced by each built HTML page, via `.agentops-scratch/measure-v2.mjs`. Byte limits: CSS 40,000; JS 35,000. Browser test confirms one requested Public Sans WOFF2 (26,832 B). No new client JS was added.

| Route | CSS gzip B | JS gzip B |
|---|---:|---:|
| Home | 3020 | 0 |
| Contact | 3850 | 7413 |
| About | 3559 | 0 |
| How we work | 3946 | 0 |

## Selected prototype (historical design evidence)

Concept C's centred oversized promise, perspective dispatch route and alternating six service scenes are shown in the existing [390px](redesign/evidence/c-390-reduced.png) / [1440px](redesign/evidence/c-1440-reduced.png) screenshots. [Full C mobile Lighthouse JSON](redesign/evidence/c-lighthouse-mobile.json) and [PR #85 measurements](redesign/evidence/measurements.json): 100/100/100/60 (SEO intentionally noindex), median LCP 1.209s, CLS/TBT 0; JS 828 B, CSS 3327 B, renderer 0 B, page 34,241 B. This prototype is unchanged; its measurements are feasibility evidence, separate from the current-build measurements above. Production motion budgets and later checks are in [motion.md](motion.md).
