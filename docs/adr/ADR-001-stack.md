# ADR-001: Site stack and toolchain

| Field | Value |
|-------|-------|
| Status | Proposed |
| Date | 2026-10-22 |
| Deciders | tech-lead · approved by owner at Gate 2 |

## Context
The PRD (`docs/product/PRD.md`) asks for a compact, content-led marketing site (about 12 pages in v1)
that must:
- reach Lighthouse ≥ 95 and Core Web Vitals "good" on mobile (NFR-PERF-1), stay readable without
  JavaScript (NFR-PERF-3), and meet WCAG 2.2 AA (NFR-A11Y-1..3);
- generate unique metadata, `sitemap.xml`, `robots.txt` and structured data (NFR-SEO-1..5);
- accept enquiries with client **and server** validation, without a Clockvane mailbox, with the
  destination held in configuration (FR-2, FR-3);
- keep brand, domain, email, socials and analytics IDs in **one** config file (FR-4, CLAUDE.md rule 5);
- build to a host-agnostic artifact with no host runtime APIs in app code (NFR-PORT-1/2, rule 6);
- cost nothing (NFR-PORT-3, rule 8) and build comfortably on an 8 GB WSL laptop;
- grow later into a blog, case studies, i18n, a client portal or an API without a rewrite (PRD §10).

If we decide nothing, every ticket in Sprint 0 is blocked.

## Options considered
Three real, maintained options for a static-first, TypeScript site. Scores 1 (poor) to 5 (excellent);
weighted total = Σ weight × score (max 160).

| Criterion (weight) | A. Astro 7 | B. Next.js 16 (`output: 'export'`) | C. Eleventy 3 |
|--------------------|-----------|-------------------------------------|---------------|
| Performance and SEO by default (5) | **5** — ships zero JS unless a component opts in (islands); built-in sitemap, image pipeline | **3** — React runtime + hydration on every page (~70–90 kB JS min.); good but needs effort to hit budget | **5** — plain HTML, zero JS by default |
| Static-first, room for dynamic later (5) | **5** — static by default; per-route server rendering, API endpoints and middleware via an adapter when needed | **4** — strong dynamic story, but static export disables server features (route handlers, middleware, ISR) | **3** — static only; dynamic features need a second stack |
| Portability, no host lock-in (5) | **5** — static `dist/`; official Node standalone adapter fits an OCI image | **3** — static export is portable; full feature set is tuned for one vendor's platform and needs third-party adapters elsewhere | **5** — static `_site/` |
| DX and type safety (4) | **5** — TypeScript first, `astro check`, content collections typed by Zod schemas | **4** — strong TS; App Router + RSC adds concepts we do not need | **2** — JS-first; templates (Nunjucks/Liquid) are untyped |
| Ecosystem maturity (3) | **4** — large, active; core team now Cloudflare-employed (see risk) | **5** — largest React ecosystem | **4** — stable, small, long track record |
| Accessibility tooling (3) | **5** — dev-toolbar a11y audit + any Playwright/axe tooling; semantic HTML templates | **4** — `eslint-plugin-jsx-a11y`, axe | **4** — axe via Playwright; nothing built in |
| Cost on free tiers (3) | **5** — static output runs on any free static host | **5** — static export on any free host | **5** — same |
| Fit for 8 GB WSL laptop (4) | **4** — Vite dev server, light builds | **2** — heaviest dev server and build memory of the three | **5** — lightest |
| **Weighted total** | **153** | **116** | **132** |

Also noted, not shortlisted: SvelteKit (good, but smaller hiring/agent knowledge pool and adapter-led
like Next.js), Hugo (fast, but Go templates and no TypeScript for the form/validation logic).

Facts checked on: 2026-10-22 via `npm view` (registry is the source of truth for versions) and the links below.
- astro 7.4.2 (engines: node ≥ 22.23.4), @astrojs/mdx 8.1.1, next 16.4.2, @11ty/eleventy 3.1.7,
  @playwright/test 1.64.1, eslint 10.13.0, zod 4.6.7, tailwindcss 5.0.5. TypeScript and Vitest
  versions were corrected on 2026-10-27 (#42), see "Toolchain versions" below.
- Next.js static export limits: <https://nextjs.org/docs/app/guides/static-exports>
- Node.js release schedule: <https://nodejs.org/en/about/previous-releases>, <https://endoflife.date/nodejs>
  (Node 24 is LTS, security support to 2028-04-30; Node 26 becomes LTS in late October 2026).
- Astro stewardship: Cloudflare acquired The Astro Technology Company on 2026-01-16; Astro stays MIT
  with multiple deployment targets: <https://alternativeto.net/news/2026/1/cloudflare-acquires-astro-team-keeps-it-open-source-with-multiple-deployment-targets>,
  <https://www.heise.de/en/news/Web-Development-Cloudflare-Acquires-Astro-Technology-Company-11145912.html?view=print>
- Eleventy release notes: <https://www.11ty.dev/blog/eleventy-v3-1/>

## Decision
We will build the site with **Astro (7.x) in static output mode**, with this toolchain:

| Concern | Choice | Why |
|---------|--------|-----|
| Framework | Astro 7.x, `output: 'static'` | Highest score; zero-JS default fits the perf budget; server routes available later without a rewrite |
| Language | TypeScript, `strict` + `noUncheckedIndexedAccess` | Type safety for config, content schemas and form logic |
| Runtime | Node.js **24 LTS** (pinned in `.nvmrc` and `package.json#engines`); move to Node 26 LTS in a follow-up once it is LTS | Production should run an LTS line; local Node 22.23.3 is below Astro's minimum 22.23.4 |
| Package manager | **npm** (bundled with Node), committed `package-lock.json`, `npm ci` in CI | No global install needed (CLAUDE.md), one fewer tool; site has few dependencies so pnpm's speed gain is marginal |
| Styling | **Plain CSS with design tokens as CSS custom properties** (`src/styles/tokens.css`, generated from `docs/design/` tokens) + Astro component-scoped `<style>`; Stylelint enforces token use (no raw colours, font sizes or spacing) | No runtime, no extra build tool; the design system is the only source of visuals (quality bar). Tailwind was considered: good, but adds a vocabulary and a major-version upgrade cycle for little gain on ~12 pages |
| Fonts | Self-hosted WOFF2, subset, `font-display: swap`, preloaded only for the body face | No third-party font requests; protects LCP/CLS |
| Images | Astro `<Image>`/`<Picture>` (sharp, build time) → AVIF/WebP with width/height set | CLS and weight budgets |
| Content | Markdown/MDX in **Astro content collections** with Zod schemas (`src/content/`). Headless CMS later through an Astro content loader, same schemas | Copy changes are reviewable PRs now; a CMS can be swapped in without touching pages |
| Site config | **`site.config.ts`** at repo root — the only home for brand name, domain, email, phone, socials, analytics ID, enquiry destination. Typed and validated with Zod at build | CLAUDE.md rule 5, FR-3, FR-4 |
| Forms | Native HTML `<form method="post">` to `site.config.ts → contact.endpoint` (works without JS) + small progressive-enhancement script for inline validation. One shared Zod schema in `src/lib/contact/` validates on client and server. Server side is a **pure handler** `handleEnquiry(Request): Response` in `src/lib/contact/`; host adapters that expose it (function, worker or container) live in `infra/`. Honeypot + time-trap for spam, no CAPTCHA by default. Delivery target chosen in ADR-002 / PRD Q4 | FR-2, FR-3, NFR-PERF-3, CLAUDE.md rule 6 |
| Analytics | None until PRD Q10 is answered; when chosen, one deferred script whose ID comes from `site.config.ts`/env | NFR-SEC-2, NFR-PERF-2 |
| Unit tests | Vitest | Vite-native, fast, same config as Astro |
| E2E + a11y | Playwright (Chromium only locally, to respect 8 GB) + `@axe-core/playwright` | FR-2 flows, WCAG checks in CI |
| Perf/SEO | Lighthouse CI (`@lhci/cli`) against the built `dist/` with budgets from `nfr.md` | Lighthouse ≥ 95 gate |
| Lint/format | ESLint (flat config, `typescript-eslint`, `eslint-plugin-astro` with its `jsx-a11y-recommended` config backed by `eslint-plugin-jsx-a11y-x`, see "Toolchain versions"), Prettier (+ `prettier-plugin-astro`), Stylelint, `astro check` for types | One command each, all in CI |
| Validation of HTML/links | `html-validate` and a link checker on `dist/` in CI | Catch broken markup/links that Lighthouse misses |

Exact versions are pinned by the lockfile at scaffold time (Sprint 0); minor/patch updates via the
dependency-update bot.

### Toolchain versions (reconciled with the Sprint 0 scaffold, #36 / PR #40)
`package-lock.json` is the source of truth for exact versions; this table records the reasons where
the resolved version differs from the registry's `latest`. Re-checked 2026-10-27 with `npm view`.

| Package | Resolved (lockfile) | `package.json` range | Registry `latest` | Why |
|---------|--------------------|----------------------|-------------------|-----|
| astro | 7.4.2 | `^7.4.2` | 7.4.2 | As decided above |
| @astrojs/check | 0.9.12 | `^0.9.12` | 0.9.12 | Powers `astro check` (type-check gate) |
| typescript | **6.0.3** | `^6.0.0` | 7.0.2 | `@astrojs/check@0.9.12` declares peer `typescript: ^5.0.0 \|\| ^6.0.0`; TypeScript 7 would break `npm ci` peer resolution and the type-check gate |
| vitest | **5.0.5** | `^5.0.5` | 5.0.5 | The earlier "4.3.3" was wrong: `npm view vitest@4.3.3` returns E404 (the 4.x line ends at 4.1.12) |
| eslint-plugin-astro | 3.2.1 | `^3.2.1` | 3.2.1 | 3.2.0 added `eslint-plugin-jsx-a11y-x` as an alternative optional peer; 1.x only loads `eslint-plugin-jsx-a11y` (#43) |
| eslint-plugin-jsx-a11y-x | 0.2.0 | `^0.2.0` | 0.2.0 | MIT fork of `eslint-plugin-jsx-a11y` (es-tooling) with peer `eslint: ^9 \|\| ^10`. The original `eslint-plugin-jsx-a11y@6.10.2` declares peer `eslint` up to `^9` only, so it fails `npm ci` against ESLint 10 (#43) |

Upgrade rules:
- **TypeScript 7** is blocked until a released `@astrojs/check` (or its replacement in Astro's
  toolchain) declares `^7` in its `peerDependencies`. Check with
  `npm view @astrojs/check peerDependencies`; the upgrade is a normal dependency PR that must pass
  `astro check`, lint, tests and build. No `--legacy-peer-deps` or `overrides` to force it.
- **Astro a11y lint** uses `eslint-plugin-jsx-a11y-x` because the original plugin has no ESLint 10
  peer. Options weighed in #43: (a) the fork with ESLint 10 — chosen, no overrides, rule names and the
  `astro/jsx-a11y/*` prefix are unchanged; (b) downgrade to ESLint 9 — rejected, steps back a major
  line and holds every other lint plugin back; (c) original plugin with `overrides` — rejected, the
  ticket forbids peer overrides. Migrating back is a dev-dependency swap with no config change: when
  `npm view eslint-plugin-jsx-a11y peerDependencies` includes `^10`, swap the dev dependency;
  `eslint-plugin-astro` prefers the original plugin when both are installed.
- Any version written in an ADR or doc must be verified against the registry (`npm view <pkg>@<version> version`)
  on the day it is written, and the lockfile wins if they disagree.

## Consequences
- Positive:
  - Pages ship as HTML/CSS with little or no JS; perf and a11y budgets are reachable by default.
  - Output is `dist/` static files, deployable to any static host or an nginx-based OCI image; no host
    runtime APIs in `src/`.
  - Growth (blog, case studies, i18n, portal/API) is additive: new collections, Astro's i18n routing,
    or per-route server rendering behind a Node adapter (see `docs/architecture/architecture.md`).
  - One typed config file makes the brand/domain/email swap a one-file change.
- Negative / trade-offs:
  - The enquiry handler needs *some* server runtime. Static output alone cannot validate on a server,
    so ADR-002 must pick a free-tier way to run the pure handler (or a form service that accepts our
    schema); this is the one place host-specific code exists, and it stays in `infra/`.
  - Astro's core team is employed by a hosting vendor (Cloudflare). Mitigation: we use only
    host-agnostic features (static output, Node adapter); no vendor bindings in `src/`.
  - Plain CSS needs discipline; Stylelint rules and design-system review make it enforceable.
  - Local Node must be upgraded to 24 LTS (user-space via nvm/fnm, no global npm packages).
- Follow-up tickets:
  - Sprint 0 scaffold: Astro + TS strict + toolchain above, `site.config.ts`, `.nvmrc`, CI jobs.
  - ADR-002 hosting: static host + where `handleEnquiry` runs; enquiry delivery (PRD Q4).
  - Token pipeline: `docs/design/` tokens → `src/styles/tokens.css`.
  - Node 26 LTS upgrade once it is promoted to Active LTS (verify date on nodejs.org).

## Exit plan / reversibility
- Content is Markdown/MDX + Zod schemas, config is a plain TS object, styles are plain CSS with
  custom properties, and form logic is a framework-free TS module. All four move unchanged to
  Eleventy, Next.js or another SSG.
- Only `.astro` page/layout/component templates would be rewritten (roughly 15–25 files for v1).
  Estimated effort: 3–5 engineer-days, mostly mechanical, protected by the Playwright and Lighthouse
  suites which test the built HTML, not the framework.
- Keep it portable now: no Astro-specific APIs inside `src/lib/`; no host adapter imports in `src/`;
  tests target URLs and rendered HTML.
