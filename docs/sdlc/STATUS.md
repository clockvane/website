# Project status

phase: release

The `phase:` line above is read by the scheduler. Only a `gate:N` pull request merged by the
owner changes it.

## Gate log
| Gate | Date | PR | Notes |
|------|------|----|-------|
| 0 — kickoff | 2026-10-21 | — | Agent team bootstrapped; brief in docs/product/BRIEF.md |
| 1 — scope approved | 2026-10-22 | — | Initiation artifacts complete; approved |
| 2 — design approved | 2026-10-27 | #55 | Design approved |
| 3 — go-live approved | 2026-11-12 | this PR | MVP merged; v1.0.0 release checklist; pending owner approval |

## Open questions for the owner
## Gate 1 summary (2026-10-22)
Artifacts: [PRD](../product/PRD.md), [personas](../product/personas.md), [success metrics](../product/success-metrics.md), [competitor scan](../product/competitor-scan.md).

Open questions for the owner (full text in PRD section 12; answer in the gate PR):
Q1 services and packages; Q2 pricing stance; Q3 target client and region; Q4 primary conversion and notification channel; Q5 proof available; Q6 about/bio; Q7 languages; Q8 contact details and socials; Q9 legal entity; Q10 analytics; Q11 targets; Q12 tone.

## Gate 2 summary (2026-10-27)
Artifacts:
- Decisions: [ADR-001 stack](../adr/ADR-001-stack.md), [ADR-002 hosting](../adr/ADR-002-hosting.md), [ADR-003 repo structure](../adr/ADR-003-repository-structure.md)
- Engineering: [architecture](../architecture/architecture.md), [NFRs](../architecture/nfr.md), [standards](../engineering/standards.md)
- UX: [sitemap](../design/sitemap.md), [user flows](../design/user-flows.md), [wireframes](../design/wireframes.md), [visual directions](../design/visual-directions.md), [design system](../design/design-system.md), [tokens](../design/tokens.json), home-page prototype (removed with change request 3)
- Content: [voice and tone](../content/voice-and-tone.md), [copy deck](../content/copy-deck.md), [microcopy](../content/microcopy.md)
- DevOps: [CI/CD](../devops/cicd.md), [release process](../devops/release.md)
- Security: [threat model](../security/threat-model.md), [headers](../security/headers.md), [privacy](../security/privacy.md)
- QA: [test strategy](../qa/test-strategy.md)

Already merged as early-start Sprint 0: scaffold, PR CI, preview deploys, security headers.

For the owner: open the prototype, read both ADRs and the copy deck. Choose the visual direction. Placeholders in the copy deck still depend on the PRD open questions Q1-Q12.

## Gate 3 summary (2026-11-12)
Artifacts: [v1.0.0 release checklist](../releases/v1.0.0.md), [release process](../devops/release.md), [test strategy](../qa/test-strategy.md), [privacy](../security/privacy.md).

State: MVP pages, enquiry flow (HubSpot via Worker), analytics, staging deploys with E2E and Lighthouse, release and rollback workflows are merged. Staging enquiry evidence is recorded. `npm audit` reports 0 vulnerabilities.

For the owner (see [Owner checklist #164](https://github.com/clockvane/website/issues/164)):
- B: set the repository variable `ENQUIRY_WORKER_ORIGIN` to `https://enquiry.mohdfarhantech08.workers.dev` (the release fails with a clear error before deploying if it is missing).
- D: confirm HubSpot's and Cloudflare's data processing terms apply to the free accounts.
- Order after merging, per [release.md](../devops/release.md): merge the release PR (version + changelog); wait for CI and staging to pass on that exact main commit; then tag `v1.0.0` is created and you approve the production deployment in GitHub. B and D must be done before the tag.
- Still open (not claimed done): QA's manual keyboard pass (pre-deploy) and staging evidence on the exact tagged commit. The [checklist](../releases/v1.0.0.md) lists them; QA, security and DevOps sign-offs are recorded through the reviews on this PR.
- The privacy notice and how-we-work defaults are not legal advice; a qualified review is still recommended (PRD Q9).
- Config placeholders `phone`, `socials.linkedin` and `socials.github` stay open after go-live (PRD Q8). They are not rendered on the site.
- Dependabot PR #205 (TypeScript 7) is not part of this release; recommend leaving it open.
