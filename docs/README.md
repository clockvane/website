# Documentation

Every document has one home, by area. Decisions are ADRs in [`adr/`](adr/); templates for new
documents are in [`templates/`](templates/).

| Area | Documents | Owner role |
|------|-----------|------------|
| Product | [Brief](product/BRIEF.md) (owner's original, read-only) · [PRD](product/PRD.md) · [Personas](product/personas.md) · [Success metrics](product/success-metrics.md) · [Competitor scan](product/competitor-scan.md) | product-owner |
| Process | [Status and gate log](sdlc/STATUS.md) · [Workflow and RACI](sdlc/WORKFLOW.md) | eng-manager |
| Decisions | [ADR-001 Stack](adr/ADR-001-stack.md) · [ADR-002 Hosting](adr/ADR-002-hosting.md) · [ADR-003 Repository structure](adr/ADR-003-repository-structure.md) | tech-lead, devops-lead |
| Architecture | [Architecture](architecture/architecture.md) · [Non-functional requirements](architecture/nfr.md) · [Engineering standards](engineering/standards.md) | tech-lead |
| Design | [Sitemap](design/sitemap.md) · [User flows](design/user-flows.md) · [Wireframes](design/wireframes.md) · [Visual directions](design/visual-directions.md) · [Design system](design/design-system.md) · [Tokens](design/tokens.json) | ux-designer |
| Content | [Voice and tone](content/voice-and-tone.md) · [Copy deck](content/copy-deck.md) · [Microcopy](content/microcopy.md) | content-writer |
| Quality | [Test strategy](qa/test-strategy.md) | qa-engineer |
| Security | [Threat model](security/threat-model.md) · [Security headers](security/headers.md) · [Privacy](security/privacy.md) | security-reviewer |
| Delivery | [CI/CD design](devops/cicd.md) · [Release process](devops/release.md) | devops-lead |

New documents go in the folder of their area, using a template from [`templates/`](templates/) where one
fits. A new area needs a row here.
