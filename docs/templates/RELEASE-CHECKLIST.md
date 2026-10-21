# Release vX.Y.Z

| Release manager | Date | Commit | Staging URL |
|-----------------|------|--------|-------------|
| devops-lead | | | |

## Scope
Merged PRs since last release (from Conventional Commits).

## Quality gates (evidence links required)
- [ ] CI green on the release commit
- [ ] E2E, accessibility and link checks green on staging
- [ ] Lighthouse ≥ targets on home + key pages (mobile and desktop)
- [ ] Security headers verified on staging (CSP, HSTS, etc.)
- [ ] Contact path tested end-to-end on staging
- [ ] No open BLOCKER/MAJOR bugs
- [ ] Placeholders intentionally present are listed below (brand, domain, email)
- [ ] 404 page, robots.txt, sitemap.xml, OG images present

## Placeholders still in use
| Placeholder | Where | Replace when |
|-------------|-------|--------------|

## Rollout and rollback
Deploy via the `production` environment (owner approves). Rollback: redeploy previous tag.

## Sign-offs
- [ ] QA  - [ ] Security  - [ ] DevOps lead  - [ ] Owner (merges gate:3 PR and approves deploy)
