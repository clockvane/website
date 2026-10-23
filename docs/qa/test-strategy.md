# Test strategy — Clockvane website

| Field | Value |
|-------|-------|
| Owner | qa-engineer |
| Status | Proposed (Gate 2 input) |
| Last updated | 2026-10-23 |
| Traces to | [ADR-001](../adr/ADR-001-stack.md) · [NFRs](../architecture/nfr.md) · [PRD](../product/PRD.md) §8 |

Build phase writes the suites; this document fixes what they cover, which tool runs them, and where.
Key pages = Home, Services, one Service detail, Contact (as in the NFRs).

## 1. Scope and risks (ranked)
1. **Enquiry path broken or silently failing** (FR-2, FR-3, O-2): the only conversion. Highest coverage.
2. **Inaccessible navigation or form** (NFR-A11Y-1..3): legal and reputational risk.
3. **Performance or SEO regression** (NFR-PERF-1, NFR-SEO-1..5): Lighthouse ≥ 95 is a stated goal.
4. **Broken links, missing 404, wrong metadata or sitemap** (FR-7, S-1..S-7).
5. **Hard-coded identity data** (FR-4, rule 5): a name/domain change must be a one-file change.
6. **Security header or handler regressions** (SEC-1..8).

## 2. Test pyramid
| Level | Tool | Scope | Where it runs |
|-------|------|-------|---------------|
| Static | ESLint, Prettier, Stylelint, `astro check` (TS strict), `html-validate` on `dist/` | Style, types, token use, valid markup, alt text (A-9) | local + CI (every PR) |
| Unit | Vitest | `src/lib/**`: `handleEnquiry` (valid, invalid, oversize, honeypot, time-trap, no HTML in outbound), Zod schemas, `site.config.ts` validation, metadata/JSON-LD builders, URL helpers | local + CI (every PR) |
| Component | Astro container API + Vitest | Components with states: form (idle, error, success), proof components render nothing without data (FR-5), nav, CTA | local + CI |
| Content/SEO script | Vitest or Node script over built `dist/` | S-1 unique title ≤ 60 and description ≤ 160, S-2 canonical/OG/Twitter, S-3 sitemap and robots, S-4 noindex on non-prod, S-5 JSON-LD shape (no rating/review), one `h1` | CI (every PR, after build) |
| Config hygiene | Grep-based test | Brand, domain, email, phone, socials, analytics IDs appear only in `site.config.ts`/env (FR-4); no host-specific imports in `src/` (NFR-PORT-1) | CI (every PR) |
| E2E | Playwright Test | Journeys in §4, against `astro preview` of the built `dist/` | local (Chromium) + CI |
| Accessibility | `@axe-core/playwright` + Playwright keyboard tests | Rules in §5 | CI (every PR) |
| Performance/SEO | Lighthouse CI (`@lhci/cli`) | Budgets in §6 on built `dist/` | CI on PR (key pages), full set nightly/main |
| Links | Link checker on `dist/` (internal) ; external-link checker | S-7 internal, external reachability | internal: every PR; external: nightly |
| Security | `npm audit --audit-level=high`, header test against preview | SEC-1..6, SEC-9 | audit every PR; headers on preview deploy |

Principle: logic is tested low (unit); pages are tested by what the visitor sees (e2e). Tests target URLs
and rendered HTML, never framework internals, so a framework swap (ADR-001 exit plan) keeps them valid.

## 3. What runs where
| Trigger | Checks |
|---------|--------|
| Local, before push | lint, type-check, unit, build, then e2e + axe for changed pages (Chromium, headless, one worker) |
| PR (required CI checks) | Static, unit, component, content/SEO script, config hygiene, build, internal links, `npm audit`, e2e smoke + axe on all routes (Chromium), Lighthouse CI on key pages (3 runs, median) |
| PR preview deploy | Header test, noindex check (S-4), Lighthouse against the preview URL when available |
| Push to `main` | Everything in PR plus the slow-tagged e2e suites (`@slow`: full viewport matrix screenshots, no-JS run) |
| Nightly (scheduled) | External link check, full Lighthouse set (all pages), `npm audit`, Firefox + WebKit e2e smoke |
| Before each release (Gate 3) | Firefox + WebKit full e2e, manual keyboard and screen-reader pass (§5), security header scan, enquiry delivery test on staging |

Resource rule (8 GB laptop): one browser, one worker, no parallel dev server + browser; kill both when done.
Playwright config: `workers: 1` locally, `fullyParallel` only in CI.

## 4. Critical e2e journeys
Tag `@smoke` = runs on every PR. Each test is independent, uses role/label selectors, and has no sleeps (use web-first assertions).

| ID | Journey | Given / When / Then | Traces to | Tag |
|----|---------|---------------------|-----------|-----|
| E-1 | Contact: happy path | Given the Contact page, when a visitor fills name, reply contact, message and submits, then a success state is shown and focus moves to it | FR-2 | @smoke |
| E-2 | Contact: validation | When required fields are empty or invalid, then errors appear next to the fields, are linked via `aria-describedby`, and are announced in a live region (client and, with JS off, server) | FR-2, A-6 | @smoke |
| E-3 | Contact: server error | When the endpoint returns an error (mocked route), then an error state with the fallback contact method is shown; nothing is dropped silently | O-2, FR-7 | @smoke |
| E-4 | Contact: spam resistance | Honeypot filled or submission under the time threshold is rejected without a visible error to bots | FR-2, SEC-8 | |
| E-5 | Contact: no JS | With JS disabled, the form posts natively and the server-rendered result page shows success or errors | NFR-PERF-3, P-10 | @slow |
| E-6 | Navigation | From Home, every page in the sitemap is reachable within two clicks; header nav, footer nav and skip link work; current page is marked `aria-current` | FR-8, A-2 | @smoke |
| E-7 | Primary CTA | The same CTA is in the header and at least once in-page on every page and leads to Contact | FR-1 | @smoke |
| E-8 | Mobile menu | At 360 px the menu opens and closes with keyboard and pointer, Escape closes, focus returns to the toggle | A-3 | @smoke |
| E-9 | 404 | An unknown URL returns the real 404 page (HTTP 404, correct title, `noindex`, links back to Home and Contact) | FR-7 | @smoke |
| E-10 | Service detail | Every service page has the same structure (heading outline, CTA, related links) | FR-6 | |
| E-11 | Empty proof | With no real proof data, testimonials/logos/stats render nothing (no empty headings) | FR-5 | |
| E-12 | Metadata | Every route has unique title/description, canonical, OG tags; present in sitemap | S-1..S-3 | @smoke |
| E-13 | Reflow | At 320 px and 200% zoom no horizontal scroll and no clipped content | A-8 | @slow |

Journey changes in a PR require the matching test change in the same PR.

## 5. Accessibility checks (WCAG 2.2 AA)
- **axe** (`wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa` tags) on every sitemap route, at 360 and 1280 px, in default state plus form error and success states and the open mobile menu. **Zero critical or serious violations fail CI** (A-1); moderate/minor are reported and triaged.
- **Structure test**: landmarks, exactly one `h1`, no skipped heading levels, skip link is first focusable and works (A-2).
- **Keyboard test** on key pages: Tab order follows DOM order, no trap, every interactive element shows a visible focus indicator, focused element is not covered by sticky header (A-3, 2.4.11). Focus contrast ≥ 3:1 is checked via computed style against tokens.
- **Target size**: bounding boxes ≥ 24×24 CSS px on nav, CTA, form controls (A-5).
- **Reduced motion**: run key pages with `reducedMotion: 'reduce'`; no animations/transitions longer than a defined minimum (A-7).
- **Forms**: labels present, errors associated and announced, no colour-only signals (A-6).
- **Manual, per release**: screen reader pass (NVDA + Firefox or VoiceOver) on Home and Contact; recorded in the release checklist. Automated tools find roughly a third of issues; this is why the manual pass exists.

## 6. Performance and SEO budgets (Lighthouse CI)
Mobile preset, 3 runs, median, on built `dist/` via `astro preview` (or preview URL). Assertions fail the PR.

| Check | Assertion | NFR |
|-------|-----------|-----|
| Category scores: Performance, Accessibility, Best Practices, SEO | each **≥ 95** on Home, Services, one Service detail, Contact | L-1..L-4 |
| LCP | ≤ 2.0 s | P-1 |
| CLS | ≤ 0.05 | P-2 |
| TBT | ≤ 150 ms | P-3 |
| JS per page (compressed) | ≤ 5 kB; Contact ≤ 15 kB; no third-party JS | P-4 |
| CSS per page | ≤ 30 kB | P-5 |
| Fonts | ≤ 4 files, ≤ 100 kB | P-6 |
| Total page weight / requests | ≤ 500 kB / ≤ 20 | P-8, P-9 |

Notes: Lighthouse variance on a shared runner is real; the median of 3 plus the policy in §8 handles it.
Thresholds are not loosened to make a PR pass; a miss means a fix or an owner-approved NFR change.
Field Web Vitals (INP, p75) are tracked only once analytics exist (PRD Q10).

## 7. Coverage expectations
- Unit: **≥ 80% line coverage on `src/lib/`** (NFR §8), enforced in Vitest config; branch coverage reported, target ≥ 70%. `handleEnquiry` and config validation aim for 100% of branches.
- No coverage target on `.astro` pages; they are covered by e2e/axe/Lighthouse across **100% of routes** in the sitemap (a test enumerates routes from `sitemap.xml`, so a new page is covered automatically).
- Every acceptance criterion in a story maps to a named test or a recorded manual check (listed in the PR evidence). New logic without a test is a review blocker.
- Bug fixes ship with a regression test unless the PR explains why not.

## 8. Viewports and browsers
| Item | Value |
|------|-------|
| Viewports | 360×800, 768×1024, 1280×800 (plus 320 for reflow, E-13) |
| Browsers, local | Chromium only, headless |
| Browsers, PR CI | Chromium |
| Browsers, nightly and pre-release | + Firefox and WebKit (free on GitHub-hosted runners) |
| Visual evidence | PR screenshots at the three viewports for UI changes; no pixel-diff gating in v1 (high maintenance, low value for ~12 pages) — revisit after launch |

## 9. Test data and environments
- No real personal data in tests; fixtures use obvious fakes (`Test Visitor`, `test@example.com`).
- The enquiry endpoint is mocked at the network layer in e2e; one real end-to-end delivery test runs manually on staging before Gate 3, with a dedicated test inbox set by the owner.
- Tests never read `.env*` files or secrets. The base URL comes from `BASE_URL` (default `http://localhost:4321`).
- Tests do not depend on each other or on execution order; each starts from a fresh page/context.

## 10. Flaky-test policy
1. A test that fails then passes on retry is **flaky**. CI allows `retries: 1` only so flakes are detected: a retried pass is reported as a warning annotation and counted, never treated as clean.
2. Within 24 h of detection, open a `type:bug` issue labelled `agent:qa-engineer` and quarantine the test (`test.fixme` with the issue number in the title). No quarantine without a ticket.
3. Quarantined tests are fixed or deleted within 7 days (one sprint at most). Quarantine count is reported in the retro; more than 3 at once blocks new feature work for the QA ticket queue.
4. Allowed fixes: better selectors, web-first assertions, deterministic data, network mocks. Forbidden: sleeps, widening timeouts to hide races, blind retry loops.
5. Lighthouse score variance is handled by median of 3 runs; a threshold failing inside 1 point of the budget is re-run once, anything else is a real failure.
6. Never "retry until green" on a PR; a failing required check is investigated.

## 11. Acceptance criteria → tests
Each story's Given/When/Then is listed in the PR as `criterion → test name` (or a manual check with evidence
such as a screenshot path). Reviewers (QA) re-run the relevant suite on the PR head and reject unverified criteria.

## 12. Exit criteria for release (Gate 3)
- All suites green on staging, including Firefox and WebKit runs.
- Lighthouse budgets in §6 met on all key pages; axe has 0 critical/serious on all routes.
- Manual keyboard and screen-reader pass recorded; enquiry delivery verified on staging.
- External link check clean; header scan clean; `npm audit` has no high/critical findings.
- No open BLOCKER or MAJOR bugs; quarantined tests count is 0 or each has an accepted-risk note.

## 13. Open items
- Tooling versions are pinned by the lockfile at scaffold time (ADR-001).
- Where `handleEnquiry` runs and how delivery is tested on staging depend on ADR-002 and PRD Q4.
- Whether a free, project-owned test inbox is available is a question for the owner (PRD Q4).
