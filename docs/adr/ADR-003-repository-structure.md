# ADR-003: Repository structure, and where infrastructure lives

| Field | Value |
|-------|-------|
| Status | Proposed — accepted when the owner merges this PR |
| Date | 2026-10-27 |
| Deciders | owner (@MohammedAbdulFarhan08) as lead · tech-lead review (`arch-impact`) |

## Context
Sprint 0 put real code in the repository: the Astro scaffold, CI, per-PR preview deploys and the security
headers. Two questions came up:

1. **Is the root getting messy?** It holds about a dozen files (`package.json`, `astro.config.mjs`,
   `tsconfig.json`, `eslint.config.js`, `.prettierrc.json`, `vitest.config.ts`, `.nvmrc`, `site.config.ts`,
   `CLAUDE.md`, `AGENTS.md`, `README.md` …), and tests sat in three different places (the repo root,
   `infra/headers/`, and `tests/` as planned in `architecture.md`). Without a written rule, every agent
   places files differently and the tree drifts.
2. **Should infrastructure and deployment live in this repository** or in a separate one, as many
   companies do?

Forces: one small static website plus one enquiry handler (ADR-001, ADR-002); a team of agents that
works through pull requests in one repository; owner-only approval for anything that deploys or
changes the rules; portability (rule 6: host specifics only in `infra/` and `.github/workflows/`);
an 8 GB laptop and a small budget; the company may later add other products (a client portal, internal
tools) and shared infrastructure (DNS, email).

## Options considered
Scores 1 (poor) to 5 (excellent); weighted total = Σ weight × score (weights sum to 23, max 115).

| Criterion (weight) | A. One repo: app + its infra + pipelines | B. Two repos: app / infra-and-deploy | C. Monorepo with workspaces now (`apps/`, `packages/`, `infra/`) |
|--------------------|-------------------------------------------|---------------------------------------|------------------------------------------------------------------|
| Atomic changes: code, headers and pipeline in one PR, tested together in one preview (5) | 5 | 2 — cross-repo PRs, version pinning between repos | 5 |
| Simple flow for the agent team and reviews (4) | 5 — one backlog, one review queue | 2 — two queues, two agent setups | 4 — workspace tooling to learn |
| Blast radius and access control (4) | 3 — mitigated by environments, CODEOWNERS, owner-merge paths | 5 — infra repo can be owner-only | 3 |
| Portability: moving hosts stays a pipeline + config change (3) | 5 — adapter layer in `infra/` | 4 | 5 |
| Overhead for one small site (4) | 5 | 2 | 2 — workspaces for a single app |
| Room to grow (3) | 3 — revisit triggers below | 4 | 5 |
| **Weighted total** | **101** | **70** | **91** |

Facts checked on 2026-10-27: no version-dependent facts; the GitHub features relied on (environments with
required reviewers, CODEOWNERS) are the ones ADR-002 already uses.

## Decision
We will keep **one repository for the website**: the application, its tests, its host adapter and deploy
scripts (`infra/`) and its pipelines (`.github/workflows/`). This is the usual enterprise pattern for one
deployable product ("you build it, you ship it"): the code and the configuration that ships it change
together and are reviewed together.

**Organisation-wide infrastructure does not live here.** The DNS zone, email routing (MX, SPF, DKIM, DMARC),
Cloudflare account settings and GitHub organisation settings belong to the company, not to one site. Until
they are code, the owner sets them up by hand and records the steps in `docs/devops/`. When they become
code, they go in a separate, owner-only repository (`clockvane/infrastructure`, Terraform with remote state).
Agents never get access to it.

### Layout
```
.
├── src/                 application code: pages, layouts, components, content, lib, styles (architecture.md §3)
├── public/              static files copied as-is (favicons, robots.txt) — created with the first page
├── tests/               all tests, mirroring the path of the code they test
│   ├── unit/            Vitest: src/ and site.config.ts   (src/lib/seo/meta.ts → tests/unit/lib/seo/meta.test.ts)
│   ├── infra/           Vitest: infra/ tooling            (infra/headers/render.ts → tests/infra/headers/render.test.ts)
│   └── e2e/             Playwright + axe browser journeys
├── infra/               host adapters, headers, deploy scripts — never imported by src/ (ADR-002)
├── .github/             workflows (CI/CD), issue and PR templates, CODEOWNERS
├── docs/                one folder per area; decisions in docs/adr/; index in docs/README.md
├── agentops/            the AI team's scheduler, safety hooks, dashboard and manual — owner-only
├── .claude/ · .codex/   agent role files, procedures and tool rules — owner-only
└── site.config.ts       the only place for brand, domain, email, socials, analytics IDs (ADR-001)
```

### What may sit at the root
Only three kinds of file:
1. **Files a tool requires at the root**: `package.json`, `package-lock.json`, `astro.config.mjs`,
   `tsconfig.json`, `eslint.config.js`, `.prettierrc.json`, `.prettierignore`, `vitest.config.ts`, `.nvmrc`,
   `.editorconfig`, `.gitignore`. Moving them into a `config/` folder would break tool discovery or need
   flags on every command — that is not cleaner, only harder to use.
2. **`site.config.ts`**: one obvious file for the company details (ADR-001, CLAUDE.md rule 5).
3. **Repository meta files**: `README.md`, `SECURITY.md`, `CLAUDE.md` (Claude Code reads it from the root),
   `AGENTS.md` (Codex reads it from the root).

Adding any other root file or a new top-level folder needs the `arch-impact` label and an update to this ADR.

### Tests
Code folders hold no tests. A unit test lives under `tests/` at the path of the code it tests, so a reviewer
finds it without searching and removing a module never leaves an orphaned test behind. Coverage thresholds
stay in `vitest.config.ts`.

### Ownership
- Owner-only (agents cannot edit): `CLAUDE.md`, `AGENTS.md`, `.claude/`, `.codex/`, `agentops/`,
  `.github/CODEOWNERS`, `docs/product/BRIEF.md`.
- Agents may change, but only the owner merges: `.github/workflows/`, `.github/actions/`, `infra/cloudflare/`
  (agentops `merge.owner_merge_paths`). Production deploys also need the owner's approval in GitHub.

## Consequences
- Positive: one PR can change a page, its headers and its pipeline together, and its preview tests exactly
  that combination; one backlog and one review queue; moving hosts touches only `infra/` and workflows;
  agents have a written rule for where things go, so the tree stops drifting.
- Negative / trade-offs: the deploy credentials (Cloudflare API token) are usable by workflows in this
  repository. Mitigated by environment branch/tag restrictions, required reviewers on `production`,
  CODEOWNERS on `.github/`, owner-only merges for workflows and `infra/cloudflare/`, and a least-privilege
  token (ADR-002). Infra scripts are public with the repository; they hold no secrets.
- Follow-up tickets: QA puts the e2e suites in `tests/e2e/`; the owner adds the layout rule to `CLAUDE.md`
  (agent kit update) and turns on private vulnerability reporting (`SECURITY.md`).

## When to revisit
- **A second deployable app** (for example a client portal): move to option C — `apps/website/`,
  `apps/<new>/`, shared code in `packages/` with npm workspaces.
- **Shared infrastructure as code** (DNS, email, a second site on the same account): create the
  `clockvane/infrastructure` repository described above; this repository keeps only its own adapter.
- **Containers on Kubernetes**: application repos build images; a separate GitOps environment repository
  (for example with Argo CD) holds the desired state per environment.

## Exit plan / reversibility
Splitting `infra/` out later is a move: copy `infra/` and the deploy workflows to the new repository, have
this repository's CI publish the build artifact, and let the infra repository deploy it (`workflow_run` or
`repository_dispatch`). About a day of work, because `src/` never imports `infra/` (enforced by ESLint).
