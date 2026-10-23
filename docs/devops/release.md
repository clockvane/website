# Release process

Companion to [cicd.md](cicd.md) and [ADR-002](../adr/ADR-002-hosting.md). Checklist template: [`docs/templates/RELEASE-CHECKLIST.md`](../templates/RELEASE-CHECKLIST.md).

## Versioning (SemVer)
Tags are `vMAJOR.MINOR.PATCH`, created on a commit on `main` that already passed staging.
| Bump | When | Example |
|---|---|---|
| MAJOR | Redesign, URL structure change, or any change needing redirects the owner must know about | `v2.0.0` |
| MINOR | New page, feature or section (`feat:`) | `v1.3.0` |
| PATCH | Fixes, copy edits, dependency updates (`fix:`, `docs:`, `chore:`) | `v1.3.1` |
- Before launch we use `v0.x.y`. The first production go-live (Gate 3) is **`v1.0.0`**.
- Pre-release candidates use `v1.0.0-rc.1`; they deploy to staging only and never to production.
- Tags are immutable. A bad release is fixed forward with a new tag, or rolled back (cicd.md), never retagged.

## Changelog
`CHANGELOG.md` is generated from Conventional Commits (Keep a Changelog layout) by the release tooling (`release-please` or
`git-cliff`, chosen in the CI ticket; both are free and need no server). Mapping: `feat` → Added, `fix` → Fixed, `perf` → Changed,
`docs`/`ci`/`chore`/`test` → hidden unless marked `!` (breaking → MAJOR). Squash-merge titles must be Conventional Commits, because
they become the entries. Each release also gets GitHub Release notes with the same text.

## Who does what
| Step | Owner |
|---|---|
| Decide that a release is due and the version | devops-lead proposes, owner agrees |
| Fill `docs/releases/vX.Y.Z.md` from the checklist template | devops-lead |
| QA and security sign-offs | qa, security |
| Create the tag (via the release PR/automation, not by hand) | devops-lead |
| **Approve the production deployment** | **owner** |
| Post-release verification and announcement | devops-lead |

## Steps
1. **Freeze.** Stop merging feature PRs. `main` is green and staging shows the candidate commit.
2. **Draft the checklist.** Copy the template to `docs/releases/vX.Y.Z.md` through a PR. Fill scope from the changelog, the commit SHA and the staging URL.
3. **Verify on staging** (evidence links in the checklist):
   - CI green on the release commit; E2E, axe and link checks passed on staging.
   - Lighthouse ≥ targets on Home, Services, Contact, mobile and desktop.
   - Security headers verified (CSP, HSTS, `noindex` correct per environment).
   - Enquiry path tested end to end; 404, `robots.txt`, `sitemap.xml`, OG images present.
   - Placeholders still in use are listed (brand/domain/email), and each is intentional.
4. **Sign-offs.** QA, security, devops-lead tick the boxes. For `v1.0.0` this is the `gate:3` PR, which the owner merges.
5. **Tag.** Merge the release PR (changelog + version), then the automation pushes tag `vX.Y.Z` on that commit.
6. **Production approval.** The tag triggers `release.yml`. The job reaches `environment: production` and **waits**. GitHub emails the owner
   (a "Review deployments" prompt); he opens the run, checks the staging evidence and the commit, then clicks **Approve and deploy** (or **Reject**).
   Only after approval does the job receive the Cloudflare token. Unapproved runs time out after 30 days.
7. **Smoke test.** The workflow fetches the release's checksum-verified artifact, deploys it, then checks status 200 on key URLs, header presence and the enquiry `/health` route.
8. **Verify and announce.** Run Lighthouse on production, check the uptime monitor, publish the GitHub Release, and update the checklist with the production URL and time.
9. **If anything fails**, run `rollback.yml` for the previous tag (cicd.md) and open an incident issue.

## Production environment settings (owner configures, one time)
- Settings → Environments → `production`: **Required reviewers** = `@MohammedAbdulFarhan08`; **Deployment branches and tags** = tags matching `v*`; enable **Prevent self-review** only if a second human reviewer exists (with a single human, leave it off so he can approve).
- Environment secrets as listed in cicd.md.

## Hotfix
Branch from `main`, fix via a normal PR (all checks still run), merge, verify on staging, tag `PATCH`, approve. There is no path around staging or the approval.

## Cadence
Staging updates on every merge to `main`. Production releases happen when the owner wants content or features live: at least when a sprint closes, and immediately for security fixes.
