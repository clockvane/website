# Home page verification — #58

Measured 2026-10-30 against the production `dist/` artifact at `/`, port 4412.
The page composes DispatchHero, six ServiceRows and CtaBand from #103; no new
scene code, CSS, dependencies or shared patterns. The optional process band is
omitted to follow the selected Concept C prototype; Home's founder and proof
sections remain omitted under the copy-deck rules.

## Checks

- `npm run lint`: passed.
- `npm run typecheck`: zero errors, warnings or hints.
- `npm test`: 109 tests passed, 14 files; 100% reported line coverage.
- `npm run build`: passed, eight static pages.
- `npm run test:dist`: 26 tests passed, including the 5,000-byte motion chunk
  assertion and no inline scripts except JSON-LD.
- `PORT=4412 npm run test:e2e`: all 67 tests passed. Home covers approved copy,
  Organization/config, metadata/sitemap, axe, 320/480/768/1024/1440 px, 200% text,
  sequential keyboard CTAs/focus, no-JS, reduced motion and Save-Data. Actual
  scene lifecycle checks cover play → done → replay, offscreen/hidden-tab pause
  (hidden state simulated through `visibilitychange`) and Escape retaining focus.

The initial unit run found missing local `happy-dom`; `npm ci` restored the
unchanged lockfile before the successful rerun. `npm audit --audit-level=high`
reports 16 existing findings (13 high, one moderate, two low) in the Lighthouse
development dependency tree. No package or lockfile changes are part of #58;
the suggested force downgrade of LHCI is outside this page ticket.

## Mobile Lighthouse

Default Lighthouse mobile simulation, three consecutive runs against the built
page. Each run scored **100 performance / 100 accessibility / 100 best practices
/ 100 SEO**.

| Run | LCP (ms) | CLS | TBT (ms) |
| --- | ---: | ---: | ---: |
| 1 | 1226.822 | 0 | 0 |
| 2 | 1209.075 | 0 | 0 |
| 3 | 1222.908 | 0 | 0 |

Median LCP: **1222.908 ms**. INP needs field evidence and is not claimed here.
LHCI's launcher failed on a read-only Windows temporary path in this WSL
environment. The same installed Lighthouse API instead connected to one Linux
Playwright Chromium instance on port 9223; the browser and preview were stopped
after measurement. Raw local reports: `.agentops-scratch/58-lighthouse-{1,2,3}.json`.

| Resource | Gzip artifact bytes | Lighthouse transfer bytes (including overhead) |
| --- | ---: | ---: |
| Motion controller / total JS | 1,022 | 1,392 |
| CSS (three files) | 5,110 | 6,165 |
| HTML | 4,516 | 4,797 |
| Font (one file) | 26,832 (WOFF2 file) | 27,152 |
| Whole page | — | 39,506 |

Six requests, zero third-party requests. No hero renderer. All byte budgets in
ADR-004 §§2/8 and the motion plan remain satisfied. Scenes visible at controller
startup stay finished under #103's anti-flash contract; explicit hero replay
runs the dispatch sequence. Other scenes play once on entry and settle.

## Visual evidence

Reviewed final static frames with reduced motion:
[320 px](58-home-320.png) · [1440 px](58-home-1440.png).
Labels and copy remain readable, the mobile CTA precedes the field, and the
desktop rows alternate art while keeping copy first in DOM order.

Service destinations remain owned by #59. Existing unconfirmed company/contact
facts stay in config/copy-deck open questions; Organization uses the configured
reserved origin until the production domain is supplied.
