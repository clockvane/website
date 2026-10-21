# SDLC workflow

How this team builds and runs the company website. Agents follow this; the owner approves gates.

## Team (RACI: R = does it, A = accountable, C = consulted/reviews, I = informed)

| Area | PO | EM | Tech Lead | UX | Content | SDE3 | SDE2 | QA | Code Rev | Security | DevOps Lead | DevOps Eng | Owner (human) |
|------|----|----|-----------|----|---------|------|------|----|----------|----------|-------------|------------|---------------|
| PRD, scope, metrics | R/A | C | C | C | C | | | | | | | | approves (Gate 1) |
| Backlog, sprints, gates | C | R/A | C | | | | | | | | C | | I |
| Stack, architecture, NFRs | C | I | R/A | C | | C | | C | | C | C | | approves (Gate 2) |
| Sitemap, wireframes, design system | C | I | C | R/A | C | C | | | | | | | approves (Gate 2) |
| Copy deck, SEO copy | C | | | C | R/A | | | | | | | | approves (Gate 2) |
| Hosting, CI/CD design, release process | | I | C | | | | | C | | C | R/A | C | approves (Gate 2) |
| Threat model, headers, privacy | | I | C | | | | | | | R/A | C | | approves (Gate 2) |
| Test strategy and suites | | I | C | | | C | | R/A | | | C | | I |
| Feature code | C | I | C | C | | R | R | C | C | C | | | I |
| Pipelines, IaC, containers | | I | C | | | | | | | C | A | R | adds secrets |
| Release to production | C | C | C | | | | | C | | C | R/A | | approves (Gate 3 + deploy) |

## Phases

### 1. Initiation — "what and why"
- **Entry:** `docs/product/BRIEF.md` exists.
- **Tickets (EM creates):** competitor scan (PO), PRD (PO), personas + success metrics (PO).
- **Outputs:** `docs/product/PRD.md`, `personas.md`, `success-metrics.md`, `competitor-scan.md`.
- **Exit — Gate 1:** EM opens a `gate:1` PR that sets `phase: design` in `STATUS.md` and lists the
  open questions. The owner reads the PRD, answers questions in the PR, and merges it.

### 2. Design — "how, on paper"
- **Tickets:** ADR-001 stack + architecture + NFRs + standards (tech lead); sitemap + user flows,
  wireframes, two visual directions, design tokens + components, home-page prototype (UX);
  voice & tone + copy deck per page + microcopy (content); ADR-002 hosting + CI/CD design +
  release process (DevOps lead); threat model + headers + privacy (security); test strategy (QA).
- **Order:** sitemap → (copy deck ∥ wireframes) → visual direction → tokens/components →
  prototype. ADR-001 and ADR-002 in parallel with design; threat model after ADR-002.
- **Exit — Gate 2:** `gate:2` PR sets `phase: build`. The owner opens the prototype, reads the two
  ADRs and the copy, and merges to approve (or comments to request changes).

### 3. Build — sprints
- **Sprint 0 (walking skeleton):** scaffold + tooling (SDE3) → CI on PRs (DevOps eng) → preview
  deploys + staging from `main` (DevOps) → tokens, base layout, header/footer, site config with
  placeholders (SDE3) → e2e/a11y/Lighthouse harness (QA).
- **Feature sprints:** one ticket per page or feature, priority from the PRD; QA tickets alongside.
- **Every PR:** CI green → reviews routed by `agentops/review-matrix.json` → all verdicts approve
  on the same commit → dispatcher sets `agent-review/summary` and squash-merges.
- **Exit:** EM opens `gate:3` (release candidate) when the MVP pages in the PRD are merged and
  staging passes the release checklist.

### 4. Release — go-live
- DevOps lead fills `docs/templates/RELEASE-CHECKLIST.md` into `docs/releases/vX.Y.Z.md`; QA,
  security and DevOps lead review it (`gate:3` reviewers).
- The owner merges the `gate:3` PR, then approves the production deployment in GitHub
  (Actions → the waiting run → Review deployments). Nothing reaches production without both.

### 5. Operate
- Dependency update PRs (Dependabot/Renovate) go through the same review flow.
- EM creates retro tickets after Gate 3 and every ~10 merged PRs.
- Improvements come back as tickets; marketing agents join later (separate team, same rules).

## Pull request lifecycle (what the dispatcher does, deterministically, no AI cost)
```
PR opened ─► CI running? wait ─► CI failed? ─► author: ACTION=fix
                │
                ▼
      next missing reviewer (order: code → security → QA → UX → DevOps lead → tech lead → PO)
                │
       ┌────────┴─────────┐
   approve             changes ─► author: ACTION=fix ─► (new commit ⇒ all reviews again)
       │                           after 3 rounds ⇒ needs-human
       ▼
 all approve on same commit ─► set agent-review/summary=success
       │
   gate:N PR? ─► label needs-human, owner merges     otherwise ─► squash-merge, delete branch
```

## Escalation
`needs-human` on any issue or PR stops agents touching it. The owner answers in a comment and
removes the label. Things that always need the owner: accounts, secrets, money, domain/email,
legal text, real company facts, gate approvals, production deploys, governance changes.

## Environments
| Env | Source | Deploys | Approval |
|-----|--------|---------|----------|
| preview | each PR | automatic (if the host supports it) | none |
| staging | `main` | automatic on merge | none |
| production | version tag `vX.Y.Z` | GitHub `production` environment | owner, every time |
