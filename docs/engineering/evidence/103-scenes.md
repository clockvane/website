# Dispatch hero and six service scenes — #103

Measured 30 October 2026, against the isolated `/__motion/` fixture produced by
`npm run test:components`. No Home or Services production route is added.

- [320 px, reduced motion](103-scenes-320.png)
- [1440 px, reduced motion](103-scenes-1440.png)

## Checks

| Check | Result |
| --- | --- |
| `npm run lint` | Pass: ESLint, Stylelint, Prettier |
| `npm run check` | Pass: Astro and TypeScript, no errors/warnings/hints |
| `npm test` | 109 passed; 100% measured line coverage in configured config/lib scope |
| `npm run build` | Pass: 8 production pages, about 0.53 s |
| `npm run test:e2e` | 57 passed |
| `npm run test:components` | 14 passed, axe has zero violations |
| `npm run test:dist` | 26 passed against production artifact |
| `DIST_DIR=.agentops-scratch/components-dist npm run test:dist` | 30 passed, including fixture script/CSS budgets and no inline scripts except JSON-LD |

Component tests cover 320/390/768/1024/1440 px, labels at 16 px or 32 px with 200% root
text, no horizontal overflow, replay focus, play → pause offscreen → resume → hidden-tab
pause → done → replay → Escape. Hidden-tab tests deterministically dispatch visibility changes;
CSS animations themselves are checked for paused play state. No-JS, reduced motion, Save-Data
and unavailable-observer paths retain all captions and hide replay. Unit tests cover the six
typed variants, full text alternatives, initial in-view final frame and controller fallback behavior.

The hero replay name prefixes the visible “Replay workflow” to the deck's “Replay the example
workflow”: axe requires the visible label to be contained in its accessible name (WCAG 2.5.3).
No new user-facing wording is introduced.

## Resource budgets

Node `gzipSync` over each requested built resource, counted once:

| Resource | Gzip bytes | Limit |
| --- | ---: | ---: |
| Motion controller (`MotionScript…ySKTgVVX.js`) | 1,022 | 5,000 |
| Total JavaScript (one first-party module) | 1,022 | 35,000 |
| Hero renderer / additional scene JavaScript | 0 | 15,000 / 0 |
| Shared shell CSS | 3,249 | — |
| Hero fixture CSS | 992 | — |
| Service rows and six scenes CSS | 1,004 | — |
| Total requested CSS | 5,245 | 40,000 |
| One self-hosted WOFF2 | 26,832 raw | 120,000 / three files |

Lighthouse resource summary: 6 requests, 39,262 transfer bytes including headers, zero third-party
requests. The limits are 20 requests and 600,000 bytes. No renderer, image, video or framework
is needed. All animation keyframes change only transform and opacity; routes and labels remain
complete underneath decorative marks. Replay is a real secondary button, focus remains in place,
and fallback policies remove animations.

## Mobile Lighthouse

Lighthouse 12.6.1, Chromium 156, default mobile simulated throttling, three sequential cold runs
against the built fixture served by Astro preview on port 4411:

| Run | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 100 | 100 | 100 | 66 | 1.212 s | 0 | 0 ms |
| 2 | 100 | 100 | 100 | 66 | 1.204 s | 0 | 0 ms |
| 3 | 100 | 100 | 100 | 66 | 1.205 s | 0 | 0 ms |

Median LCP 1.205 s, CLS 0, TBT 0. SEO is intentionally below the production threshold because
the test-only route has `noindex`; its failed SEO audit is `is-crawlable`. Production page SEO
and full Home/Services Lighthouse checks remain with #58/#59. These are component-fixture
measurements, not evidence for those unbuilt pages or field INP. Raw local reports remain in
ignored `.agentops-scratch/103-lighthouse-{1,2,3}.json`.
