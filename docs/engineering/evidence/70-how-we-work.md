# Issue #70 — How we work

Verified on 2026-10-29 with Node 24.22.1 and Chromium against the static build.
Screenshots: [320 px](70-how-we-work-320.png) · [1280 px](70-how-we-work-1280.png).
Both were inspected for readable placeholders, ordered steps, desktop output columns,
engagement rows, heading hierarchy and the closing CTA.

| Check | Result |
| --- | --- |
| `npm run lint` | ESLint, Stylelint and Prettier pass |
| `npm run check` | Astro: zero errors, warnings or hints; `tsc --noEmit` passes |
| `npm test` | 54 tests in 9 files pass; configured line coverage 100% |
| `npm run build` | Five static pages; new route and sitemap generated |
| `npm run test:e2e` | 32 tests pass using one Chromium worker on port 4411 |

Page checks cover copy and section order, all four process outputs, engagement models,
retained Q1/Q2 placeholders, the config-driven CTA leading to Contact, distinct metadata
and sitemap inclusion. Axe reports zero WCAG A/AA violations at 320, 360, 768 and 1280 px.
The 320/1280 px checks also cover skip navigation, CTA focus, 200% text reflow and
reading/following the CTA with JavaScript disabled. The page has no script elements.

## Performance

The standard `npm run test:lighthouse` cannot find the local `lhci` executable in this
checkout. The existing scratch-only Lighthouse/Chromium setup measured the built page
with mobile defaults, three sequential runs and one browser on port 4411. Its runner
closed the browser and preview in `finally`; no workaround ships in application code.

| Metric | Run 1 | Run 2 | Run 3 | Median / budget |
| --- | ---: | ---: | ---: | ---: |
| Performance | 69 | 100 | 99 | 99 / ≥95 |
| Accessibility / best practices / SEO | 100 / 100 / 100 | 100 / 100 / 100 | 100 / 100 / 100 | 100 each / ≥95 |
| LCP | 1.570 s | 1.513 s | 1.550 s | 1.550 s / ≤2 s |
| CLS | 0 | 0.00151 | 0.00151 | 0.00151 / ≤0.05 |
| TBT | 2947.5 ms | 0 ms | 0 ms | 0 ms / ≤150 ms |

The first run overlapped the final lint check and reported high blocking time despite
the script-free page; subsequent runs with lint finished returned zero blocking time.
All median category and timing budgets pass. No dependency, font or client JavaScript
was added. The approved copy retains four unresolved placeholders: handover commitments,
retainer scope/hours, package prices, and ownership/access terms. They need owner input
before release.

## PR #73 merge verification

Merged `origin/main` on 2026-10-29, retaining its privacy/404 pages and the How we work
page. The shared browser route list includes both `/privacy/` and `/how-we-work/`.
Lint, Astro/TypeScript checks, 57 unit tests (100% configured line coverage), the
seven-page static build and all 43 browser tests pass on port 4412. Regression tests
reject protocol-relative and slash/backslash CTA destinations; browser checks assert
the rendered CTA label and destination against config without writing screenshots.

Lighthouse CI now runs locally: all configured assertions pass for `/` and
`/how-we-work/`, three runs per route, with no assertion failures. The default Chrome
launcher attempts to create its profile in a read-only Windows directory under WSL.
A scratch runner launched one Playwright-managed Chromium browser and passed its
debugging port to the unchanged LHCI configuration. It closed the browser after LHCI
completed; LHCI managed and stopped the preview on port 4412. No runtime or layout
change was needed.
