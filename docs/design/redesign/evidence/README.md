# Verification record — issue #80

Measured 2026-10-29. [Raw run metrics and byte counts](measurements.json) · [browser checks](browser-checks.json) · [computed contrast](contrast.md).

## Mobile Lighthouse

Lighthouse **13.5.0**, mobile Moto G Power emulation (412 × 823, DPR 1.75), simulated slow 4G (150 ms RTT, 1638.4 kbps), 4× CPU slowdown. Three fresh Chromium processes per concept, animations enabled, local HTTP on port 4411 with gzip and strict CSP. Each metric below is its own median of three; each full report is the middle run when sorted by performance score. Ties retain run order. The full report's individual timings can therefore differ from the medians below.

| Concept | Performance / Accessibility / Best practices / SEO | Median LCP | Median CLS | Median TBT |
|---|---|---|---|---|
| A | 100 / 100 / 100 / 60 | 1.216 s | 0.0000 | 0.0 ms |
| B | 100 / 100 / 100 / 60 | 1.509 s | 0.0015 | 0.0 ms |
| C | 100 / 100 / 100 / 60 | 1.209 s | 0.0000 | 0.0 ms |

Performance meets ≥95; LCP meets ≤2 s; CLS meets ≤0.05; TBT meets ≤150 ms (largest observed TBT across nine final runs: 75.5 ms). Accessibility and best practices also meet ≥95. **SEO is intentionally 60, not a pass against the production ≥95 target:** `noindex,nofollow` is required for nonproduction artifacts by NFR S-4. The only failing scored SEO audit is `is-crawlable`; all other applicable SEO audits pass. No audit was disabled or the result adjusted. These three concepts are not production key pages. Production indexability must be verified after the selected direction is implemented.

TBT is a lab proxy, not a field INP result. No real-user INP or physical Android-device claim is made. Local serving has no persistent cache policy, so Lighthouse's cache/dependency/render-blocking recommendations remain visible; this does not push the measured metrics over budget.

| Full attached report | Machine-readable report |
|---|---|
| [A — mobile HTML](a-lighthouse-mobile.html) | [A JSON](a-lighthouse-mobile.json) |
| [B — mobile HTML](b-lighthouse-mobile.html) | [B JSON](b-lighthouse-mobile.json) |
| [C — mobile HTML](c-lighthouse-mobile.html) | [C JSON](c-lighthouse-mobile.json) |

Download/open Lighthouse HTML locally: its own inline report scripts are not meant to run under the prototype server's strict CSP.

## Payload budgets

Bytes are gzip sums of each HTML/CSS/JS resource plus the already-compressed WOFF2 bytes. Includes all inline SVG through the HTML count. Does not include review screenshots/reports, which the prototypes never request. Decimal kB budgets, no external resources.

| Concept | HTML gzip bytes | JS gzip bytes | CSS gzip bytes | Font bytes | Page bytes | Requests |
|---|---:|---:|---:|---:|---:|---:|
| A | 3202 | 828 | 3003 | 26832 (1 files) | 33865 | 5 |
| B | 3234 | 828 | 3247 | 84916 (2 files) | 92225 | 6 |
| C | 3254 | 828 | 3327 | 26832 (1 files) | 34241 | 5 |

All pass: JS ≤35,000 B, controller ≤5,000 B (actual **828 B**), hero renderer ≤15,000 B (actual **0 B**), CSS ≤40,000 B, fonts ≤120,000 B / ≤3 files, page ≤600,000 B, ≤20 requests. A/C reuse one existing font; B reuses two. Font licences remain alongside the existing files; no new fonts or dependencies were added.

## Browser and visual checks

- Chromium with WebGL disabled: all concepts, widths 320, 390, 480, 768, 1024 and 1440 px; no horizontal overflow. Also 200% root text enlargement at 390 px.
- axe WCAG 2.0/2.1/2.2 A/AA at 390 and 1440 px with reduced motion: zero violations. Lighthouse also audits the normal-motion render. Computed contrast covers every opaque palette pair, including inverse text, borders, focus, hover and disabled states.
- Minimum 44 px interactive targets, keyboard skip link, audit destination focus, native disclosure, keyboard replay, Escape, one-shot completion and all six service replays. Off-screen pause/resume verified by scrolling. Hidden-tab policy verified by a controlled `document.hidden` override plus `visibilitychange`, not a physical tab-switch timing claim.
- JS disabled, Save-Data and reduced-data preference: headline and six services visible, anchor navigation usable, replay controls hidden, no active animation. Reduced motion: zero animations. No WebGL renderer is used or downloaded in any mode.
- Zero third-party requests, console errors or page errors. Source inspection: no inline scripts, inline style or event-handler attributes. Forced-colours output inspected; CSS uses system focus and diagram stroke colours.
- Full-page reduced-motion screenshots: [A phone](a-390-reduced.png), [A desktop](a-1440-reduced.png), [B phone](b-390-reduced.png), [B desktop](b-1440-reduced.png), [C phone](c-390-reduced.png), [C desktop](c-1440-reduced.png). Matching `*-hero.png` captures show the initial viewport.
- Visual self-check fixed the smallest link target, unavailable arrow glyphs, C's enlarged-text overflow, B's vane direction and A's packet lane so it cannot cover tool labels. Replay accessible names retain the complete visible label.

## Repository checks and reproduction

Passed `npm run lint`, `npm run typecheck` (79 files; zero diagnostics), `npm test` (10 files / 64 tests; 100% line/function coverage), `npm run build` (8 pages), and `git diff --check`. Existing production output is unchanged.

Build the artifacts with `node docs/design/redesign/render.mjs`. Serve with `node docs/design/redesign/serve.mjs` and open `http://127.0.0.1:4411/redesign/concept-a/` (B/C similarly). Stop the server with Ctrl+C. The session's scratch probes were `node .agentops-scratch/contrast.mjs`, `node .agentops-scratch/check-80.mjs`, and `node .agentops-scratch/measure-80.mjs`. Scratch probes are git-ignored; the final outputs are attached here. Reproduce Lighthouse using the installed Lighthouse CLI against each served URL with its default mobile preset, three fresh runs. No source/production routes were changed.

