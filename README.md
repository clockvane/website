# Clockvane website

The company website of **Clockvane** — automation of boring business work, websites and apps, custom
software, cloud & DevOps and AI automation. *Automation that runs like clockwork.*

| | |
|---|---|
| Status | Current phase and gate log: [`docs/sdlc/STATUS.md`](docs/sdlc/STATUS.md) |
| Stack | Astro (static output) · TypeScript strict · plain CSS with design tokens · Zod · Vitest · Playwright — [ADR-001](docs/adr/ADR-001-stack.md) |
| Hosting | Cloudflare Pages: a preview for every PR, staging from `main`, production from release tags with the owner's approval — [ADR-002](docs/adr/ADR-002-hosting.md) |
| Repository rules | Layout and where infrastructure lives — [ADR-003](docs/adr/ADR-003-repository-structure.md) |
| Owner | [@MohammedAbdulFarhan08](https://github.com/MohammedAbdulFarhan08) |

## Quick start

Requires Node.js 24 LTS (pinned in `.nvmrc`) and npm.

```bash
nvm use        # Node 24
npm ci         # exact versions from package-lock.json
npm run dev    # http://localhost:4321 (or $PORT)
```

| Command                | What it does                                                    |
| ---------------------- | --------------------------------------------------------------- |
| `npm run dev`          | Dev server on `$PORT` (default 4321)                            |
| `npm run build`        | Static build into `dist/`                                       |
| `npm run preview`      | Serves `dist/` on `$PORT` (default 4321)                        |
| `npm run lint`         | ESLint (TypeScript + Astro) and Prettier check                  |
| `npm run format:check` | Prettier check (`npm run format` writes changes)                |
| `npm run typecheck`    | `astro check` (TypeScript strict + `noUncheckedIndexedAccess`)  |
| `npm run check`        | `astro check` plus `tsc --noEmit`, the CI `typecheck` job       |
| `npm test`             | Vitest with V8 coverage (text + `coverage/lcov.info`)           |
| `npm run test:e2e`     | Chromium navigation, reflow and axe checks against a built site |

Coverage must stay at 80% of lines or more per file for `site.config.ts` and `src/lib/`. ESLint blocks
host SDK and `infra/` imports and direct `process.env` access in `src/`. Stylelint checks CSS and Astro
styles for raw colors, font sizes and spacing; Astro accessibility rules check markup.

## Shared page shell

Pages compose `src/layouts/BaseLayout.astro` with required, unique `title` and `description` props
and one `h1` in their content. The layout supplies metadata, skip navigation, header, main and footer;
`noindex` is optional for utility pages. Copy and shared navigation labels live in `src/content/`.
Navigation targets follow the approved sitemap; destination pages belong to their feature tickets.

Astro config runs `src/styles/generate.mjs` before dev, check or build. It generates ignored
`src/styles/tokens.css` from `docs/design/tokens.json`, including literal media thresholds from
`src/styles/responsive.template.css`. Edit those sources, then restart the command to regenerate.
Base styles and component styles consume CSS custom properties. Keep responsive classes in the
template so breakpoints also come from tokens. Production CSS stays external for the existing CSP.
The approved sitemap integration includes every built page and excludes utility pages; `robots.txt`
references its index. Preview deployment still supplies its existing disallow-all robots override.

The two licensed WOFF2 files under `public/fonts/` total 84,916 bytes. Only the body face is preloaded.
The shared 1200×630 PNG social image is rasterized from the token-colored workflow motif at build time;
it adds no client JavaScript. Canonical/social URLs read the configured domain; while that domain is
a placeholder they use a reserved non-live origin defined only in `site.config.ts`.

For browser checks, run `npx playwright install chromium` once, then `npm run build` and
`npm run test:e2e`. Tests use one worker and manage a foreground preview on `$PORT` (default 4411).
Screenshots go to ignored `.agentops-scratch/`; reviewed shell evidence is under
`docs/engineering/evidence/`. The suite covers keyboard/no-JS disclosures, axe, 44 px targets,
320 px reflow, 200% text, forced colors and reduced motion. Page content and closing CTA
sections are separate feature work.

The contact journey is now implemented; its portable handler and Worker boundary,
validation rules, tests and required delivery activation steps are documented in
[`docs/engineering/contact.md`](docs/engineering/contact.md). Per ADR-002, delivery
remains an explicit error-only stub until the owner chooses a notification channel.

## Repository layout

```
.
├── src/                 application code: pages, layouts, components, content, lib, styles
├── public/              static files copied as-is (favicons, robots.txt) — created with the first page
├── tests/               all tests, at the path of the code they test
│   ├── unit/            Vitest for src/ and site.config.ts
│   ├── infra/           Vitest for infra/ tooling
│   └── e2e/             Playwright + axe browser journeys
├── infra/               host adapter, security headers, deploy scripts (never imported by src/)
├── .github/             CI/CD workflows, issue and PR templates, CODEOWNERS
├── docs/                requirements, design, architecture, decisions, runbooks — start at docs/README.md
├── agentops/            the AI team's scheduler, safety hooks, dashboard and manual (owner-only)
├── .claude/ · .codex/   agent role files, procedures and tool rules (owner-only)
└── site.config.ts       the only place for brand, domain, email, socials and analytics IDs
```

Files at the root are there because a tool reads them from the root, or because they describe the
repository:

| File | Why it is at the root |
|------|------------------------|
| `package.json`, `package-lock.json` | the npm project and its exact dependency versions |
| `astro.config.mjs` | Astro's config (static output, dev server port) |
| `tsconfig.json` | TypeScript settings (strictest preset) |
| `eslint.config.js` | lint rules, including the `src/` ↔ `infra/` boundary |
| `.prettierrc.json`, `.prettierignore` | formatting rules |
| `vitest.config.ts` | unit-test runner and coverage thresholds |
| `.nvmrc`, `.editorconfig`, `.gitignore` | Node version, editor basics, ignored files |
| `site.config.ts` | company details in one place ([ADR-001](docs/adr/ADR-001-stack.md)) |
| `CLAUDE.md`, `AGENTS.md` | the rules every AI agent follows (Claude Code reads `CLAUDE.md`, Codex reads `AGENTS.md`) |
| `README.md`, `SECURITY.md` | this page, and how to report a vulnerability |

Anything new at the root, or a new top-level folder, needs the tech lead's review (`arch-impact`) and an
update to [ADR-003](docs/adr/ADR-003-repository-structure.md).

## How work gets done

The site is built by a team of AI agents (product owner, engineering manager, tech lead, designer,
writer, engineers, QA, reviewers, DevOps) the way a large engineering organisation works:

1. **Backlog** — GitHub Issues with acceptance criteria, owner role and dependencies.
2. **One ticket, one pull request** — branch `<role>/<issue>-<slug>`, Conventional Commits.
3. **Independent reviews** — each PR is reviewed by the roles its files require; verdicts are commit
   statuses `agent-review/<role>`. CI (lint, types, tests, build, preview deploy) must pass.
4. **Merge** — automatic once every required review approves; changes to workflows, `infra/cloudflare/`
   and the agents' rules are merged only by the owner.
5. **Gates** — the owner approves each phase (scope, design, go-live) by merging a `gate:N` pull request.

The agents' rules are in [`CLAUDE.md`](CLAUDE.md), the process and RACI in
[`docs/sdlc/WORKFLOW.md`](docs/sdlc/WORKFLOW.md), and how to run the team (start, stop, limits,
dashboard, updates) in [`agentops/README.md`](agentops/README.md).

## Environments

| Environment | Deployed from | Approval |
|-------------|---------------|----------|
| preview | every pull request | none — URL posted on the PR, `noindex` |
| staging | every merge to `main` (same build artifact) | none |
| production | release tag `vX.Y.Z` | the owner, in GitHub (`environment: production`) |

Pipeline design, secrets and rollback: [`docs/devops/cicd.md`](docs/devops/cicd.md) ·
release process: [`docs/devops/release.md`](docs/devops/release.md).

## Configuration and secrets

- Company details (name, domain, email, phone, socials, analytics ID) live only in `site.config.ts`;
  values not decided yet are marked `[[PLACEHOLDER: …]]`.
- Secrets never enter the repository. They live in GitHub environments and are added by the owner.
  `.env` files are not committed.

## Security

Please report vulnerabilities privately — see [`SECURITY.md`](SECURITY.md).
