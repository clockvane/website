# Engineering standards — Clockvane website

| Field | Value |
|-------|-------|
| Owner | tech-lead |
| Status | Proposed (Gate 2 input) |
| Last updated | 2026-10-22 |
| Applies to | Stack in [ADR-001](../adr/ADR-001-stack.md); layout in [architecture](../architecture/architecture.md) |

These rules add stack-specific detail to CLAUDE.md. Where they conflict, CLAUDE.md wins.

## 1. Toolchain and commands
Node 24 LTS (`.nvmrc`), npm with committed `package-lock.json`. Scripts every PR must pass:

| Command | Does |
|---------|------|
| `npm run lint` | ESLint + Stylelint + Prettier `--check` |
| `npm run typecheck` | `astro check` (TS strict over `.ts` and `.astro`) |
| `npm test` | Vitest unit tests with coverage |
| `npm run build` | `astro build` → `dist/` |
| `npm run test:e2e` | Playwright + axe against `astro preview` of `dist/` (Chromium) |
| `npm run lhci` | Lighthouse CI with budgets from `nfr.md` |

Local runs: one `astro dev` or `astro preview` at a time; stop it before finishing.

## 2. Code style
- TypeScript `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`. No `any`
  (use `unknown` + narrowing); no `@ts-ignore` (use `@ts-expect-error` with a reason and ticket).
- Prettier formats; do not hand-format. ESLint errors fail CI; no blanket `eslint-disable`.
- Named exports only (except where Astro requires a default). No barrel files that re-export
  everything.
- Naming: components `PascalCase.astro`; modules `kebab-case.ts`; functions/vars `camelCase`;
  constants `SCREAMING_SNAKE_CASE` only for true constants; routes lowercase-hyphenated.
- Comments explain *why*. `TODO` only as `TODO(#123): …`.

## 3. Folder and boundary rules
- `src/pages/` contains routing only: fetch content, choose layout, compose sections. No business logic.
- `src/lib/` is **framework-free TypeScript**: no `astro:*` imports, no DOM, no host APIs. It is
  where all testable logic lives (SEO builders, contact schema/handler, config accessors).
- `src/components/ui/` primitives never import from `sections/`; `sections/` may import `ui/`.
- Nothing in `src/` imports from `infra/`, host SDKs (`@vercel/*`, `@netlify/*`, `cloudflare:*`,
  `@cloudflare/*`, etc.) or reads `process.env` directly — use `import.meta.env.PUBLIC_*` via
  `src/lib/config/`. Enforced with ESLint `no-restricted-imports`.
- **Brand, domain, email, phone, socials, analytics IDs** come only from `site.config.ts`. A CI grep
  fails if the brand name, domain or an email address literal appears elsewhere in `src/` (copy in
  `src/content/` reads the brand through a component/variable).

## 4. Component rules
- Semantic HTML first; ARIA only when no native element fits. Buttons are `<button>`, links are `<a href>`.
- Every component has a typed `Props` interface; required props are required (e.g. layouts require
  `title` and `description`).
- Styles: component-scoped `<style>`; values only from tokens (`var(--color-…)`, `var(--space-…)`,
  `var(--font-size-…)`). Stylelint rejects raw hex/rgb, px font sizes and unlisted spacing values.
  Global CSS limited to `tokens.css`, `base.css` (reset, typography), `utilities.css` (e.g. `.visually-hidden`).
- No client JS by default. A `client:*` directive or `<script>` needs a reason in the PR and must fit
  the JS budget. No UI framework (React/Vue/Svelte) without an ADR.
- Images via Astro `<Image>`/`<Picture>` with width, height and `alt` (empty only if decorative).
- Proof components accept a list and render nothing when it is empty (FR-5). Never seed fake data.
- Every interactive element has hover, focus-visible, active, disabled, loading and error states as
  defined in the design system.

## 5. Content rules
- Copy lives in `src/content/` (from the approved copy deck), not in components. Components may hold
  structural micro-copy only if it is in the copy deck.
- Every collection entry passes its Zod schema; SEO fields are required.
- `[[PLACEHOLDER: …]]` is allowed until Gate 3; the production build fails if any remain.

## 6. Error handling
- `src/lib/` functions return typed results (`{ ok: true, value } | { ok: false, error }`) for
  expected failures (validation, delivery); throw only for programmer errors.
- `handleEnquiry` never leaks internals: responds `400` with field errors, `413` for oversize, `429`
  when rate-limited, `502` when delivery fails (with a generic message), `303` redirect to the
  success page for native (no-JS) posts.
- The form UI always shows a recoverable state: field errors next to fields, a summary with focus
  moved to it, and a fallback contact method from config on network or server error.
- No `console.log` in committed code; build-time warnings fail CI in `astro check`.

## 7. Testing pyramid
| Layer | Tool | Scope | Rule |
|-------|------|-------|------|
| Static | TS, ESLint, Stylelint, html-validate | Everything | Must be clean |
| Unit | Vitest | `src/lib/` (schema, handler, spam checks, SEO builders, config validation) | New logic ships with tests; ≥ 80% line coverage on `src/lib/` |
| Content/build | Vitest over `dist/` | Unique titles/descriptions, sitemap contents, JSON-LD, no placeholders (prod), no brand literals outside config | Runs after build in CI |
| E2E + a11y | Playwright + axe | Every sitemap route (axe), nav, 404, contact happy/error/no-JS paths, 320 px reflow, keyboard | Key journeys only; no pixel-perfect snapshots |
| Performance | Lighthouse CI | Key pages | Budgets in `nfr.md` |

Tests are deterministic: no real network (mock `fetch` in unit tests; stub the endpoint in e2e).

## 8. Dependencies
- Add a dependency only if it saves meaningful code or risk; state the reason, size and licence
  (MIT/Apache-2.0/BSD/ISC preferred) in the PR. Runtime (client) deps need tech-lead review.
- Pin via lockfile; `npm ci` in CI; `npm audit --audit-level=high` must pass.
- Major upgrades go through their own ticket.

## 9. Commits and pull requests
- Conventional Commits with `Agent-Role:` trailer (CLAUDE.md). Scope = area: `contact`, `seo`,
  `layout`, `content`, `styles`, `ci`, `infra`, `deps`.
- One ticket = one PR, < 400 changed lines excluding lockfile/assets.
- PR includes: evidence of `lint`, `typecheck`, `test`, `build` output; e2e/LHCI results for UI
  changes; screenshots at 320 px and desktop for visual changes; a note on JS/CSS budget impact if
  any client code was added.
- Label `arch-impact` when touching `site.config.ts` schema, `src/lib/` public APIs, `infra/`,
  `astro.config.mjs`, CI, or adding a dependency.
