# Issue #65 — shared page components

Verified on 2026-10-28 with Node 24.22.1, the committed npm lockfile and Chromium.
The screenshots show a test composition of every component, not a new production page:
[320 px](65-components-320.png) · [1440 px](65-components-1440.png).

| Check | Result |
| --- | --- |
| `npm ci` | Completed; no dependency or lockfile changes |
| `npm run lint` | ESLint, Stylelint and Prettier passed |
| `npm run check` | Astro: zero errors/warnings/hints; plain `tsc --noEmit` passed |
| `npm test` | 9 files / 53 tests passed, including 6 Astro container component tests; configured logic/config line coverage 100% |
| `npm run build` | Static production artifact built; 4 existing pages; no `/__components/` route |
| `PORT=4412 npm run test:components` | 5 tests passed: 320/768/1024/1440 px plus no-JS reading |
| `PORT=4412 npm run test:e2e` | All 24 existing production journey/shell tests passed |
| `npm audit --omit=dev --audit-level=high` | Zero vulnerabilities |

Component browser checks found zero axe violations at every tested width. Sequential Tab order
visits only explicit links within main; each link is at least 44 × 44 px and has a solid visible
focus indicator. Both diagram layouts render, while the narrow desktop diagram stays vertical.
The tests also check one adjacent alternative per diagram, no inline styles or client scripts,
label size/bounds at normal and 200% text, no horizontal overflow, forced colors and reduced motion.
The screenshots were inspected for heading hierarchy, ruled rows, process order, panel contrast
and the inverse CTA. Default and overview service copy share the navigation's source/order.

## Performance evidence

Three mobile Lighthouse runs used the existing NFR assertions. On WSL the bundled legacy launcher
chose a read-only Windows temp path, so a scratch runner launched Linux Playwright Chromium and
passed its debugging port to LHCI. The runner closed Chromium after each group; LHCI managed its
preview on port 4412. No launcher workaround enters application code or project configuration.

| Artifact / URL | Performance | Accessibility | Best practices | SEO | Median LCP | Median CLS | TBT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Production `/` | 100 | 100 | 100 | 100 | 1.369 s | 0.00018 | 0 ms |
| Isolated `/__components/` | 100 | 100 | 100 | 66 (intentional noindex) | 1.514 s | 0.00018 | 0 ms |

All measured performance/accessibility/best-practice assertions pass. Fixture SEO indexing is
excluded from assertions because this test route explicitly uses noindex; its only failing SEO
audit is indexing. Production Home passes every configured category and timing assertion.

The fixture loads two external stylesheets: 5,427 + 11,161 raw bytes; 1,071 + 2,628 gzip bytes
(3,699 bytes total versus the 30 kB per-page CSS budget). It contains zero script elements.
Existing fonts remain 84,916 bytes across two self-hosted WOFF2 files. Actual future pages should
repeat Lighthouse measurements after assembly; this ticket changes no production page journey.

## Inherited tooling limitation

The full `npm audit --audit-level=high` returns 16 advisories (13 high, 1 moderate, 2 low), all high
findings in the existing `@lhci/cli` development-tool chain. The lockfile is identical to
`origin/main`; this PR introduces no dependencies. The production-only audit is clean. Dependency
remediation belongs to the existing tooling maintenance scope rather than a forced upgrade here.
