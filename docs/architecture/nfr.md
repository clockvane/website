# Non-functional requirements — Clockvane website

| Field | Value |
|-------|-------|
| Owner | tech-lead |
| Status | Proposed (Gate 2 input) |
| Last updated | 2026-10-30 (change request 2 limits per ADR-005: P-1, P-4, P-8, P-9, P-11, new P-12…P-14, L-1) |
| Traces to | PRD §7, §8.3–8.7 · BRIEF change request 2 · [ADR-001](../adr/ADR-001-stack.md) · [ADR-004](../adr/ADR-004-motion-and-effects.md) · [ADR-005](../adr/ADR-005-immersive-layer.md) |

Every NFR has an ID, a measurable target and how it is checked. "CI" means the check fails the PR.
Key pages = Home, Services, one Service detail, Contact.

## 1. Performance (NFR-PERF-1, -2, -3)
Measured with Lighthouse CI on the built `dist/`, mobile preset (simulated Moto G Power, slow 4G),
median of 3 runs.

Owner limits from change request 2 (2026-10-30), which replace the 29 October table:

| Limit | Value |
|-------|-------|
| First paint | Headline, text and call to action are plain HTML/CSS. LCP ≤ 2.5 s on the mobile lab test; layout shift ≤ 0.05 |
| Script before the 3D starts | ≤ 50 kB compressed |
| 3D layer (engine, shaders, scenes) | Loads after first paint, only on capable devices: ≤ 400 kB compressed script, plus ≤ 2 MB of compressed assets on desktop and ≤ 800 kB on phones. Engine: three.js ([ADR-005](../adr/ADR-005-immersive-layer.md) §1) |
| Lighthouse, mobile | Home and service pages: performance ≥ 90, other categories ≥ 95. All other pages: ≥ 95 in all four |
| Frame rate | 60 fps on a mid-range laptop, ≥ 30 fps on a mid-range Android. GPU tier detection scales particles, resolution and effects |
| Fallbacks | Reduced motion, data saver, no WebGL and low-end GPUs get a beautiful static render of the same world, with all content usable without JavaScript |
| Always | Pause when the tab is hidden or the scene is off-screen; keyboard access and WCAG 2.2 AA throughout |

The IDs below make those limits checkable. "Compressed" = gzip -9, measured over `dist/`.

| ID | Metric | Budget | Check |
|----|--------|--------|-------|
| P-1 | Largest Contentful Paint | ≤ 2.5 s lab, mobile (≤ 2.5 s p75 field); the LCP element is HTML text, never the canvas | CI (LHCI assertion) |
| P-2 | Cumulative Layout Shift | ≤ 0.05 lab (≤ 0.1 p75 field) | CI |
| P-3 | Total Blocking Time (lab proxy for INP) | ≤ 150 ms; INP ≤ 200 ms p75 field | CI (TBT), field once analytics exist |
| P-4 | JavaScript before the 3D starts (compressed) | ≤ 50 kB per page, of which motion controller ≤ 5 kB, immersive boot ≤ 8 kB, contact enhancement ≤ 15 kB; 0 third-party JS ([ADR-005](../adr/ADR-005-immersive-layer.md) §2–§3) | CI (`dist/` bundle-size check per chunk + LHCI) |
| P-5 | CSS per page (compressed) | ≤ 40 kB | CI |
| P-6 | Fonts | ≤ 3 files, ≤ 120 kB total WOFF2, self-hosted | CI |
| P-7 | Images | ≤ 200 kB above the fold; AVIF/WebP; explicit width/height | CI + review |
| P-8 | Total page weight before the 3D starts (compressed) | ≤ 600 kB on key pages (3D layer counted in P-12) | CI |
| P-9 | Requests on first load, before the 3D starts | ≤ 20 | CI |
| P-10 | No-JS reading | All content readable and nav usable with JS disabled; form posts natively; no element stuck in a pre-animation hidden state | Playwright run with JS disabled |
| P-11 | Motion | Only `transform`/`opacity` animated; effects pause off-screen and in hidden tabs; reduced motion and Save-Data load no 3D layer and run no animations ([ADR-004](../adr/ADR-004-motion-and-effects.md) §3–§4, [ADR-005](../adr/ADR-005-immersive-layer.md) §5–§6) | Playwright `reducedMotion: 'reduce'` and no-WebGL runs + review |
| P-12 | 3D layer (engine, worker, shaders, scenes; compressed) | Starts after `load` + idle, only on tiers 1–3; script ≤ 400 kB; assets ≤ 2 MB desktop, ≤ 800 kB phone (tier 1); rendering in a worker, no main-thread long task > 50 ms while it loads or scrolls; 60 fps mid-range laptop, ≥ 30 fps mid-range Android; DPR, particles and post-processing per tier ([ADR-005](../adr/ADR-005-immersive-layer.md) §4) | CI size check + LHCI forced-tier run + frame-time smoke test; real-device fps on the release checklist |
| P-13 | Static fallback | Reduced motion, Save-Data, slow connection, no JS, no WebGL2/`OffscreenCanvas` and low-end GPUs (tier 0) get the static render of the same world; engine chunks are not requested; all content and the form usable | Playwright fallback runs (network assertion + screenshot + axe) |
| P-14 | Visual stability of the 3D | No layout shift when the canvas appears (box reserved in CSS); deterministic frames match baselines | Canvas visual regression in CI |

## 2. Lighthouse targets
| ID | Category | Target on key pages | Check |
|----|----------|---------------------|-------|
| L-1 | Performance | Home and service pages ≥ 90; all other pages ≥ 95 (mobile preset; home also with `?tier=1`, [ADR-005](../adr/ADR-005-immersive-layer.md) §9) | CI |
| L-2 | Accessibility | ≥ 95 (aim 100) | CI |
| L-3 | Best Practices | ≥ 95 | CI |
| L-4 | SEO | ≥ 95 (aim 100) | CI |

## 3. Accessibility — WCAG 2.2 AA (NFR-A11Y-1..3)
| ID | Requirement | Check |
|----|-------------|-------|
| A-1 | 0 critical/serious axe violations on every page in the sitemap | CI (Playwright + axe, all routes) |
| A-2 | Landmarks (`header`, `nav`, `main`, `footer`), one `h1`, no skipped heading levels, skip link | CI (axe + custom test) |
| A-3 | Keyboard: all interactive elements reachable in DOM order, no traps; visible focus with ≥ 3:1 contrast and not obscured (2.4.11) | Playwright keyboard test on key pages + manual per release |
| A-4 | Contrast: text ≥ 4.5:1 (large ≥ 3:1), UI components ≥ 3:1 | Design tokens checked at design review; axe in CI |
| A-5 | Target size ≥ 24×24 CSS px (2.5.8) | Review + Playwright bounding-box check on nav/CTA/form |
| A-6 | Forms: visible labels, errors linked with `aria-describedby`, announced via live region, no colour-only signals; no CAPTCHA by default (3.3.8) | Playwright + axe |
| A-7 | `prefers-reduced-motion` honoured; no auto-playing motion > 5 s | Review + CSS lint rule |
| A-8 | Reflow at 320 px and 200% zoom with no loss of content or horizontal scroll | Playwright screenshots at 320 px |
| A-9 | Meaningful `alt` on content images; decorative images `alt=""` | CI (html-validate + axe) |

## 4. SEO (NFR-SEO-1..5)
| ID | Requirement | Check |
|----|-------------|-------|
| S-1 | Unique `<title>` (≤ 60 chars) and meta description (≤ 160) on 100% of pages | CI script over `dist/` |
| S-2 | Canonical URL, OG (`og:title`, `og:description`, `og:image` 1200×630, `og:url`) and Twitter card tags | CI script |
| S-3 | `sitemap.xml` lists every indexable page and no empty-safe/hidden ones; `robots.txt` references it | CI |
| S-4 | Non-production: `noindex` meta + disallow-all `robots.txt` | CI on preview build |
| S-5 | JSON-LD (Organization, WebSite, Service, BreadcrumbList, ContactPage) validates; no rating/review fields | CI schema test |
| S-6 | Lowercase, hyphenated, stable URLs; trailing-slash policy fixed in config | Review + link checker |
| S-7 | 0 broken internal links | CI link checker |

## 5. Browser and device support
- Last 2 versions of Chrome, Edge, Firefox, Safari (macOS and iOS), and Samsung Internet; Firefox ESR.
- Core content and the form work without JavaScript in any browser that supports HTML5 forms.
- Viewports 320 px – 2560 px. Playwright CI runs Chromium; WebKit and Firefox run before each
  release (not per PR, to save resources on the 8 GB build machine).

## 6. Security baseline (NFR-SEC-1, -2)
Headers are defined once in `infra/headers` and applied by every host adapter.

| ID | Header / control | Value |
|----|------------------|-------|
| SEC-1 | `Content-Security-Policy` | `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self' <contact endpoint origin>; form-action 'self' <contact endpoint origin>; frame-ancestors 'none'; base-uri 'self'; object-src 'none'; upgrade-insecure-requests` (analytics origin added only after PRD Q10) |
| SEC-2 | `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` (add `preload` only once the real domain is final) |
| SEC-3 | `X-Content-Type-Options` | `nosniff` |
| SEC-4 | `Referrer-Policy` | `strict-origin-when-cross-origin` |
| SEC-5 | `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=()` |
| SEC-6 | `Cross-Origin-Opener-Policy` | `same-origin` |
| SEC-7 | HTTPS only; HTTP → HTTPS redirect | Host config (ADR-002) |
| SEC-8 | Enquiry handler: server-side Zod validation, max body 10 kB, field length limits, honeypot + minimum-time check, rate limit per IP where host allows, no HTML in outbound notification | Unit tests on `handleEnquiry` |
| SEC-9 | Dependencies: `npm audit --audit-level=high` clean; lockfile committed; new deps justified in PR | CI |
| SEC-10 | No secrets in repo; secret scanning on | GitHub settings (human) + CI |
| SEC-11 | Privacy: collect only name, reply contact, message; no cookies set by us; analytics without cross-site tracking | Review + privacy notice |

Check: header test against the preview deploy (and a securityheaders-style scan before Gate 3).

## 7. Availability and operations
| ID | Target | How |
|----|--------|-----|
| O-1 | Uptime ≥ 99.9% monthly for static pages (bounded by the free-tier host SLA) | Free external uptime monitor (set up in operate phase; account by the human) |
| O-2 | Enquiry path: failed deliveries are visible — handler returns an error state to the visitor with fallback contact method; no silent drops | E2E test + manual test before launch |
| O-3 | Build time ≤ 3 min in CI; local `npm run build` peak memory ≤ 2 GB | CI timing; measured in Sprint 0 |
| O-4 | Rollback = redeploy previous artifact in ≤ 15 min | Pipeline design (CI/CD ticket) |
| O-5 | Recovery: site rebuildable from git alone (no state outside the repo except secrets) | By design |

## 8. Maintainability
- Lint, type-check, unit, e2e, Lighthouse and link checks are required CI checks.
- Unit-test coverage ≥ 80% lines for `src/lib/` (logic); pages are covered by e2e, not unit tests.
- Dependencies: patch/minor weekly via update bot; major upgrades through a ticket.
