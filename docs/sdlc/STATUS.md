# Project status

phase: build

The `phase:` line above is read by the scheduler. Only a `gate:N` pull request merged by the
owner changes it.

## Gate log
| Gate | Date | PR | Notes |
|------|------|----|-------|
| 0 — kickoff | 2026-10-21 | — | Agent team bootstrapped; brief in docs/product/BRIEF.md |
| 1 — scope approved | 2026-10-22 | — | Initiation artifacts complete; approved |
| 2 — design approved | 2026-10-27 | this PR | Design artifacts complete; pending owner approval |

## Open questions for the owner
## Gate 1 summary (2026-10-22)
Artifacts: [PRD](../product/PRD.md), [personas](../product/personas.md), [success metrics](../product/success-metrics.md), [competitor scan](../product/competitor-scan.md).

Open questions for the owner (full text in PRD section 12; answer in the gate PR):
Q1 services and packages; Q2 pricing stance; Q3 target client and region; Q4 primary conversion and notification channel; Q5 proof available; Q6 about/bio; Q7 languages; Q8 contact details and socials; Q9 legal entity; Q10 analytics; Q11 targets; Q12 tone.

## Gate 2 summary (2026-10-27)
Artifacts:
- Decisions: [ADR-001 stack](../adr/ADR-001-stack.md), [ADR-002 hosting](../adr/ADR-002-hosting.md), [ADR-003 repo structure](../adr/ADR-003-repository-structure.md)
- Engineering: [architecture](../architecture/architecture.md), [NFRs](../architecture/nfr.md), [standards](../engineering/standards.md)
- UX: [sitemap](../design/sitemap.md), [user flows](../design/user-flows.md), [wireframes](../design/wireframes.md), [visual directions](../design/visual-directions.md), [design system](../design/design-system.md), [tokens](../design/tokens.json), [home-page prototype](../design/prototype/index.html)
- Content: [voice and tone](../content/voice-and-tone.md), [copy deck](../content/copy-deck.md), [microcopy](../content/microcopy.md)
- DevOps: [CI/CD](../devops/cicd.md), [release process](../devops/release.md)
- Security: [threat model](../security/threat-model.md), [headers](../security/headers.md), [privacy](../security/privacy.md)
- QA: [test strategy](../qa/test-strategy.md)

Already merged as early-start Sprint 0: scaffold, PR CI, preview deploys, security headers.

For the owner: open the prototype, read both ADRs and the copy deck. Choose the visual direction. Placeholders in the copy deck still depend on the PRD open questions Q1-Q12.
