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

## First go-live (`v1.0.0`)
The current candidate is recorded in [`docs/releases/v0.1.0.md`](../releases/v0.1.0.md). Its open items O-1 to O-7 come first.
Steps marked **needs-human** are for the owner only. Agents never create accounts, add secrets or change rulesets.

**Before Gate 3**
1. **needs-human: Required checks.** Once O-3 is merged, go to Settings → Rules → the `main` ruleset → Require status
   checks. Add `e2e-a11y` and `html-links` next to `lint`, `typecheck`, `unit`, `build`, `lighthouse`, using the exact job names.
2. **needs-human: Enquiry destination** (after the PRD Q4 channel is final). Create the WhatsApp or Telegram webhook and the
   Google Sheet backup. Then go to Cloudflare → Workers & Pages → the enquiry Worker → Settings → Variables and Secrets →
   **Add secret**, once for each `ENQUIRY_*` name that the Worker ticket lists. Paste the values only there, never in an issue
   or PR. Then send one test enquiry on staging.
3. The agents close O-1 to O-7, and QA and security sign off on staging. The EM then opens the `gate:3` PR. It renames the
   checklist to `v1.0.0.md` and includes the release PR (version and changelog).

**Production deploy**
4. **needs-human:** merge the `gate:3` PR. The release automation pushes tag `v1.0.0` on that commit.
5. **needs-human:** when GitHub emails "Review deployments", open the `release.yml` run, check that the commit matches the
   checklist, then click **Approve and deploy**.
6. The workflow deploys the verified `main` artifact to the Cloudflare production branch (`CF_PAGES_PRODUCTION_BRANCH`).
   It smoke-tests `https://clockvane-website.pages.dev/` (status 200, headers, no `noindex`) and the Worker `/health`.
7. devops-lead runs Lighthouse on production and adds the production URL, time and run links to the checklist.

**Rollback**
- After a later release: run `rollback.yml` with the previous tag, and the owner approves under `production` (cicd.md § Rollback).
- For `v1.0.0` itself there is no earlier production deployment. Fallback: Cloudflare → Pages → `clockvane-website` →
  Deployments → choose the last good production deployment → **Rollback to this deployment**. If the site must go dark,
  **needs-human:** remove the custom domain (if any), or open an incident issue and fix forward with `v1.0.1`.

**Domain and DNS** (when the owner buys one, [ADR-002](../adr/ADR-002-hosting.md) domain plan). Until then production is `clockvane-website.pages.dev`.
1. **needs-human:** buy the domain (spend approval). Recommended: move its nameservers to Cloudflare (free) so the apex works.
2. **needs-human:** Cloudflare → Pages → `clockvane-website` → Custom domains → **Set up a domain**. Enter the apex, then
   `www`, and accept the DNS records Cloudflare proposes. TLS is issued automatically.
3. **needs-human:** turn on Email Routing (or another mailbox) for the public address, if one is wanted.
4. An agent PR then updates `site.config.ts` (domain and email) and the `pages.dev` → domain Bulk Redirect in `infra/cloudflare/`.
   It ships as a PATCH or MINOR release through the normal flow.
5. **needs-human:** after Gate 3, create the free uptime monitor (UptimeRobot or Cloudflare Health Checks) for `/` and the
   Worker `/health`, with alerts to the owner's email.

## Hotfix
Branch from `main`, fix via a normal PR (all checks still run), merge, verify on staging, tag `PATCH`, approve. There is no path around staging or the approval.

## Cadence
Staging updates on every merge to `main`. Production releases happen when the owner wants content or features live: at least when a sprint closes, and immediately for security fixes.
