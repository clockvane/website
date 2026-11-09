# Non-functional requirements — Clockvane website

| Field | Value |
|-------|-------|
| Owner | tech-lead |
| Status | v3, Proposed (Gate 2e input) |
| Last updated | 2026-11-09 (#169: P-3, P-4, SEC-1 for Cloudflare Web Analytics) · 2026-11-04 (v3 for change request 3: P-1, P-4, P-7, P-8, P-9, P-10, P-11, new P-15, §1.1, L-1, A-7) |
| Traces to | PRD §7, §8.3–8.7 · BRIEF change request 3 · [ADR-001](../adr/ADR-001-stack.md) · [ADR-004](../adr/ADR-004-motion-and-effects.md) |

Every NFR has an ID, a measurable target and how it is checked. "CI" means the check fails the PR.
Key pages = Home, Services, one Service detail, Contact. Budgets in §1 and §2 apply to every page.

## 1. Performance (NFR-PERF-1, -2, -3)
Measured with Lighthouse CI on the built `dist/`, mobile preset (simulated Moto G Power, slow 4G),
median of 3 runs.

Owner limits from change request 3 (2026-11-03), which replace the change request 2 table:

| Limit | Value |
|-------|-------|
| Lighthouse, mobile, every page | ≥ 95 in all four categories |
| First paint | LCP ≤ 2.0 s on the mobile lab test; layout shift ≤ 0.05 |
| Script | ≤ 50 kB compressed per page, motion controller ≤ 5 kB; CSS marquees and small vanilla JS, no animation framework |
| Images | AVIF or WebP, responsive `srcset`/`sizes`, lazy below the fold, explicit dimensions |
| Page weight | ≤ 1.5 MB compressed |
| Motion | Marquees stop with reduced motion and the page stays complete; WCAG 2.2 AA throughout |

The IDs below make those limits checkable. "Compressed" = gzip -9, measured over `dist/`. IDs P-12 to
P-14 are retired and not reused.

| ID | Metric | Budget | Check |
|----|--------|--------|-------|
| P-1 | Largest Contentful Paint | ≤ 2.0 s lab, mobile (≤ 2.5 s p75 field). The LCP element is the HTML headline or an eager image with `fetchpriority="high"`, never an element that is hidden until revealed or inserted by script | CI (LHCI assertion) |
| P-2 | Cumulative Layout Shift | ≤ 0.05 lab (≤ 0.1 p75 field) | CI |
| P-3 | Total Blocking Time (lab proxy for INP) | ≤ 150 ms; INP ≤ 200 ms p75 field | CI (TBT). The analytics beacon (P-4) never loads on CI (`127.0.0.1`) or preview origins, so CI cannot measure it; it is deferred and runs after parse. A production Lighthouse run after each go-live covers it (release checklist, "After deploy"); field data comes from Cloudflare Web Analytics |
| P-4 | JavaScript per page (compressed) | ≤ 50 kB, of which motion controller ≤ 5 kB, contact enhancement ≤ 15 kB, first-party analytics loader ≤ 1 kB. Third-party JS: only Cloudflare Web Analytics `https://static.cloudflareinsights.com/beacon.min.js`, deferred, injected by the first-party loader only on the production origin and never when Global Privacy Control is on ([headers.md §Analytics](../security/headers.md), #169). Any other third-party script needs an ADR ([ADR-004](../adr/ADR-004-motion-and-effects.md) §2) | CI (`dist/` size check per chunk and per page). The beacon is not in `dist/`; the production Lighthouse run in P-3 covers it |
| P-5 | CSS per page (compressed) | ≤ 40 kB | CI (`dist/` size check) |
| P-6 | Fonts | ≤ 3 files, ≤ 120 kB total WOFF2, self-hosted | CI |
| P-7 | Images | AVIF with WebP fallback only (no PNG, JPEG or GIF in the page); `srcset` and `sizes` on every raster image; `loading="lazy"` below the fold; `width` and `height` always; ≤ 200 kB above the fold; each generated file ≤ 100 kB (§1.1) | CI (§1.1) + review |
| P-8 | Total page weight (compressed) | ≤ 1.5 MB on every page, counting every image a visitor loads by scrolling to the end | CI (§1.1) |
| P-9 | Requests on first load, before any scrolling | ≤ 40. Raised from 20: browsers fetch lazy images near the viewport, so an image-rich first screen uses more requests at little cost over HTTP/2. P-1 and P-8 are the limits that protect the visitor | CI |
| P-10 | No-JS reading | All content readable and nav usable with JS disabled; form posts natively; no element stuck in a pre-animation hidden state; marquees show their stopped layout | Playwright run with JS disabled |
| P-11 | Motion | Only `transform`/`opacity` animated; effects pause off-screen and in hidden tabs; reduced motion and Save-Data run no looping or scroll-driven animation ([ADR-004](../adr/ADR-004-motion-and-effects.md) §3–§4) | Playwright `reducedMotion: 'reduce'` run + review |
| P-15 | Marquees | Run only when motion is allowed and the controller has loaded; a visible pause control on each one or its group; pause on hover and on keyboard focus; stop with reduced motion; loop copies are `aria-hidden`, hold nothing focusable and cost no extra image bytes ([ADR-004](../adr/ADR-004-motion-and-effects.md) §4) | Playwright: pause control by keyboard, `document.getAnimations()` empty under reduced motion, axe |

### 1.1 Image pipeline and how CI checks it
Example screens become optimised images at build time, with the Astro image tooling already chosen in
[ADR-001](../adr/ADR-001-stack.md). There is no third-party image CDN and no runtime image service.
Measurements: [evidence](../engineering/evidence/nfr-v3-image-pipeline.md).

1. **Source.** Original screens we design ourselves, committed as PNG under `src/assets/examples/`,
   at most 1600 px wide. Nothing goes in `public/`, because that skips the pipeline. No remote sources,
   so `image.domains` stays empty.
2. **Build.** Pages render them with `<Picture>` from `astro:assets` (sharp), and the files land in
   `dist/_astro/` with hashed names. Use `formats={['avif']}`, `fallbackFormat="webp"` (the default
   fallback would ship PNG) and `widths={[320, 480, 640, 960]}`, with `sizes` set to the slot's real
   width. Keep the default encoder quality unless a visual check says otherwise. Leave `image.layout`
   off: this path needs no injected styles and emits no `style=` attributes, which SEC-1 requires.
3. **Loading.** Only images in the first screen are `loading="eager"`, and at most one has
   `fetchpriority="high"`. Everything else is `loading="lazy"` and `decoding="async"`.
4. **Build cost (O-3).** Generated images are cached in `node_modules/.astro/assets`. CI restores that
   folder after `npm ci`, because a cold run spends about 1 s per screen on this laptop.

The `lighthouse` CI job enforces this on every page, using two checks because Lighthouse does not
scroll and so never sees most lazy images:

| Check | Asserts |
|-------|---------|
| LHCI (`tests/e2e/lighthouserc.cjs`) | P-1…P-3, categories; `resource-summary:total:size` ≤ 1 500 000 and `resource-summary:total:count` ≤ 40; `resource-summary:font:size` ≤ 120 000; `unsized-images` and `modern-image-formats` as errors; `uses-responsive-images` and `offscreen-images` as warnings |
| `dist/` scan (`npm run test:dist`, same job) | Script and CSS gzip sizes (P-4, P-5), measured here because the preview server's transfer sizes may not be compressed. No `.png`, `.jpg`, `.jpeg` or `.gif` in `dist/_astro/`. Every `<img>` that is not SVG has `alt`, `width`, `height`, `srcset` and `sizes`. Each generated image ≤ 100 kB. Above the fold: the largest AVIF candidate of each image that is not lazy sums to ≤ 200 kB. Whole page: gzip HTML + CSS + JS + all fonts + the largest AVIF candidate of each distinct image ≤ 1.5 MB, a deliberate upper bound |

## 2. Lighthouse targets
| ID | Category | Target on every page | Check |
|----|----------|---------------------|-------|
| L-1 | Performance | ≥ 95 (mobile preset) | CI |
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
| A-7 | `prefers-reduced-motion` honoured. Anything that auto-plays for more than 5 s, marquees included, has a visible pause control (2.2.2) and stops with reduced motion | Playwright (P-15) + review + CSS lint rule |
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
| SEC-1 | `Content-Security-Policy` | `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self' <contact endpoint origin>; form-action 'self' <contact endpoint origin>; frame-ancestors 'none'; base-uri 'self'; object-src 'none'; upgrade-insecure-requests`. Only when the build has an analytics token: `script-src` adds the exact URL `https://static.cloudflareinsights.com/beacon.min.js` and `connect-src` adds `https://cloudflareinsights.com` ([headers.md §Analytics](../security/headers.md)) |
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
| O-3 | Build time ≤ 3 min in CI; local `npm run build` peak memory ≤ 2 GB | CI timing; measured in Sprint 0; image cost in §1.1 |
| O-4 | Rollback = redeploy previous artifact in ≤ 15 min | Pipeline design (CI/CD ticket) |
| O-5 | Recovery: site rebuildable from git alone (no state outside the repo except secrets) | By design |

## 8. Maintainability
- Lint, type-check, unit, e2e, Lighthouse and link checks are required CI checks.
- Unit-test coverage ≥ 80% lines for `src/lib/` (logic); pages are covered by e2e, not unit tests.
- Dependencies: patch/minor weekly via update bot; major upgrades through a ticket.
