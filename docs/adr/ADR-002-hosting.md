# ADR-002: Hosting, environments and delivery

| Field | Value |
|-------|-------|
| Status | Proposed |
| Date | 2026-10-23 |
| Deciders | devops-lead · approved by owner at Gate 2 |

## Context
ADR-001 fixes the stack: Astro static output (`dist/`) plus one small enquiry handler,
`handleEnquiry(Request): Response`, that needs a server runtime. Constraints:
- Free tier only until the owner approves spend (CLAUDE.md rule 8, NFR-PORT-3); agents never create accounts.
- Portable: no host APIs in `src/`; host specifics only in `infra/` and `.github/workflows/` (rule 6, NFR-PORT-1/2).
- A preview for every PR (NFR-PORT-4), a staging environment from `main`, production only after Gate 3
  and the owner's approval.
- Security headers defined once in `infra/headers` (CSP, HSTS, …) and applied by the host adapter (`nfr.md` SEC-*).
- No custom domain yet: we use the host's free subdomain until the owner buys `clockvane.com` (or another).
- The repository is public, which widens the free options (GitHub environments with required reviewers work on public repos).

If we decide nothing, the Sprint 0 preview-deploy ticket is blocked.

## Options considered
Scores 1 (poor) to 5 (excellent); weighted total = Σ weight × score (weights sum to 34, max 170).
Traffic scenarios assume a baseline of about 5,000 page views a month at about 0.5 MB each (≈ 2.5 GB egress);
10x ≈ 25 GB, 100x ≈ 250 GB. These are planning estimates, not measurements.

| Criterion (weight) | A. Cloudflare Pages (+ one Worker for enquiries) | B. Netlify | C. GitHub Pages | D. GCP Cloud Run (nginx OCI image) |
|---|---|---|---|---|
| Free limits (4) | **5** — 500 builds/mo (we build in GitHub Actions, so only deploy-uploads matter), unlimited static requests and bandwidth, 20,000 files, 25 MiB/file | **2** — 300 credits/mo shared pool; bandwidth 20 credits/GB (≈ 15 GB); no overage, all sites paused at 0 | **3** — 1 GB site, ~100 GB/mo soft bandwidth; public repos only on Free | **3** — 2M requests, 180k vCPU-s, 360k GiB-s per month, ~1 GiB egress; billing account (card) required |
| Preview deploys per PR (5) | **5** — unlimited; `wrangler pages deploy --branch=pr-N` gives a stable URL per PR | **5** — free, built in | **1** — one site per repo; PR previews need hacks | **3** — a tagged revision with `--no-traffic` per PR works but we script and clean it up |
| Custom domain + TLS later (3) | **5** — free certificates, 100 domains per project; DNS can stay at the registrar (CNAME) or move to Cloudflare | **4** — free TLS | **4** — free TLS, one domain | **3** — domain mapping or a load balancer; managed certificate; more steps |
| Header control (4) | **4** — `_headers` file (CSP, HSTS, X-Robots-Tag per environment) | **4** — `_headers` or `netlify.toml` | **1** — no custom response headers; CSP only via `<meta>`, no HSTS control, which breaks `nfr.md` SEC-* | **5** — full control in `nginx.conf` |
| Build minutes (2) | **5** — builds run in GitHub Actions (free on public repos), so host minutes are irrelevant | **4** — minutes no longer metered; production deploys cost credits | **5** — same, via Actions | **5** — same |
| IaC / CLI support (4) | **4** — `wrangler`, official Terraform provider, REST API | **4** — `netlify-cli`, Terraform provider | **3** — Actions-native, few settings to codify | **5** — `gcloud`, first-class Terraform, native fit for the owner's GCP skills |
| Vendor lock-in (5) | **4** — static files + `_headers` + one fetch-style Worker; all portable (see Exit plan) | **4** — static files + `_headers`; functions use a Netlify API shape | **4** — plain files, but nothing beyond static | **5** — standard OCI image runs anywhere |
| Cost at 10x / 100x (4) | **5** — $0 / $0 (static); the Worker free limit is 100k requests/day | **2** — 10x ≈ 500 credits: over the free pool → Personal $9/mo; 100x ≈ 5,000 credits: beyond Pro's 3,000 | **3** — $0 / likely over the soft cap, GitHub may ask us to move | **3** — about $0 / $3–5 / $30+ (egress, no CDN); a CDN in front fixes it |
| Operational effort (3) | **4** — one account, no servers | **4** | **5** | **2** — registry, service accounts, WIF, scaling and patching base images |
| **Weighted total (max 170)** | **154** | **125** | **102** | **129** |

Also considered and excluded: **Vercel Hobby** — restricted to non-commercial use, and a business site is commercial,
so the free plan does not apply. **Firebase Hosting** — a viable GCP-native alternative (free Spark plan, preview channels), but it
adds a second proprietary config format for little gain over Cloudflare; kept as exit option 2.

Facts checked on: 2026-10-23. Free-tier terms change; re-check before the Gate 3 deploy.
- Cloudflare Pages limits (500 builds/mo, 20,000 files, 25 MiB per file, 100 domains, unlimited preview deployments): <https://developers.cloudflare.com/pages/platform/limits/>
- Workers pricing (static asset requests free and unlimited; 100,000 Worker requests/day on Free): <https://developers.cloudflare.com/workers/platform/pricing/>
- Netlify credit model (300 credits/mo on Free reported by third parties; rates 20 credits/GB bandwidth, 2 per 10,000 requests per the official changelog; Netlify's own pages did not state the free pool): <https://www.netlify.com/changelog/2026-04-14-pricing-updates-april-2026/>, <https://netli.fyi/blog/netlify-free-plan-limits-2026>
- GitHub Pages limits (1 GB site, ~100 GB/mo soft bandwidth, 10 min deploy timeout; free only for public repos): <https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits>
- Cloud Run pricing (2M requests, 180k vCPU-s, 360k GiB-s free; the official page did not render, so figures come from third-party pages and must be verified): <https://cloud.google.com/run/pricing>
- Vercel Hobby is non-commercial only: <https://vercel.com/docs/limits/fair-use-guidelines>

## Decision
We will host on **Cloudflare Pages (Direct Upload from GitHub Actions)** with **one Cloudflare Worker** for the
enquiry handler, using the free `*.pages.dev` / `*.workers.dev` subdomains until the owner buys a domain.

- **Build once, deploy many.** CI builds `dist/` once per commit and uploads it as a GitHub Actions artifact with a
  SHA-256 manifest. Every environment deploys that same artifact; nothing is rebuilt. Cloudflare's Git integration
  is **not** used, so there is no second build system and the artifact stays host-agnostic.
- **Environment-specific behaviour is deploy-time only.** The artifact contains no environment flags. The
  deploy step adds a `_headers` file generated from `infra/headers` (plus `X-Robots-Tag: noindex` for preview and
  staging) next to the artifact contents. `site.config.ts` holds the production URL, so canonical URLs in
  previews point at production; this is harmless because previews are `noindex`. This resolves the conflict between
  NFR-SEO-2 (non-production `noindex`) and build-once.
- **Environments**

| Environment | Trigger | URL (until a domain exists) | Protection |
|---|---|---|---|
| preview | each PR commit | `pr-<N>.<project>.pages.dev` | `noindex`; same-repo PRs only (no secrets for forks); torn down on PR close |
| staging | push to `main` | `staging.<project>.pages.dev` | `noindex`; GitHub environment `staging`, no approval |
| production | tag `vX.Y.Z` | `<project>.pages.dev`, later `clockvane.com` | GitHub environment `production` with the owner as required reviewer; Cloudflare production branch |

- **Enquiry handler.** `infra/cloudflare/enquiry-worker/` is a thin wrapper that calls the portable `handleEnquiry`.
  The destination (PRD Q4) is set by Worker secrets, never in the repo. Until Q4 is answered the handler is a no-op
  stub that returns the fallback-contact error state. `site.config.ts → contact.endpoint` points at it.
  Because both live on different origins, the CSP `connect-src`/`form-action` include that origin (already in `nfr.md`).
- **Authentication.** Cloudflare does not accept GitHub OIDC for its API, so a **scoped API token** (Pages edit +
  Workers edit, one account) is the exception to the OIDC preference. Mitigation: the token is stored as an
  **environment secret**, so production's token is released only to jobs the owner has approved; `staging` and
  `preview` use the same account token in their own environments; rotate it every 90 days. The exit target
  (Cloud Run) supports OIDC through Workload Identity Federation, which removes the stored secret entirely.
- **Domain and DNS plan.** (1) Now: `*.pages.dev`. (2) When the owner buys the domain: add it as a custom domain on the
  Pages project; keep DNS at the registrar and add the CNAME Cloudflare shows (apex needs Cloudflare DNS or a registrar
  that supports CNAME flattening/ALIAS, so the simplest path is moving the domain's nameservers to Cloudflare, which is free).
  (3) Update `site.config.ts` domain and email, then ship a release; the old `pages.dev` URL 301-redirects to the new domain.
  Email (MX/SPF/DKIM) is a separate decision and PRD Q8.
- **Observability on free tiers.** Uptime: a free external monitor (UptimeRobot or Cloudflare Health Checks, owner creates the
  account) hitting `/` and the Worker's health route. Lighthouse CI: results uploaded as workflow artifacts and a
  trend file committed by a scheduled job to a `lhci-history` branch (no server). Dependencies: Dependabot (npm and github-actions
  weekly, grouped). Details in `docs/devops/cicd.md`.

### What the owner must do (also in the `needs-human` issue linked from the PR)
1. Create a free Cloudflare account (email + 2FA); no card is needed.
2. In Cloudflare: *Workers & Pages → Create → Pages → Direct Upload*, project name `clockvane-website` (or tell us the name you chose).
3. Create an API token (*My Profile → API Tokens → Custom*) with **Account · Cloudflare Pages · Edit** and
   **Account · Workers Scripts · Edit**; copy the token and the **Account ID**.
4. In GitHub *Settings → Environments*, create `preview`, `staging` and `production`; on `production` add
   yourself as **Required reviewer** and restrict deployment to tags `v*`.
5. Add secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` to each environment, and repository variable
   `CF_PAGES_PROJECT`. Never paste them in an issue or PR.
6. Optional now: create a free uptime monitor for the production URL once Gate 3 passes.

## Consequences
- Positive: $0 at 100x static traffic; unlimited PR previews; one artifact for every environment; the owner approves production
  inside GitHub; the exit plan is already written.
- Negative / trade-offs:
  - Stored Cloudflare token instead of OIDC (mitigated above).
  - Worker runtime differs from Node: `handleEnquiry` may only use web-standard APIs. A unit test runs it under a
    Workers-like runtime (Miniflare) in the infra ticket.
  - Per-IP rate limiting (SEC-8) relies on Cloudflare features; on another host it moves to nginx or Cloud Armor.
  - Cloudflare also owns Astro's team (ADR-001); concentration risk is accepted because nothing in `src/` is Cloudflare-specific.
  - Cloudflare recommends Workers Static Assets for new projects. Pages is supported today; if it is deprecated, the
    migration is the same `dist/` plus a `wrangler.toml` (about 2 hours).
- Follow-up tickets (to be created by the EM):
  - CI workflow (lint → type → unit → build → e2e/a11y → Lighthouse) per `cicd.md`.
  - Preview, staging and production deploy workflows and `infra/cloudflare/` adapter, `infra/headers`.
  - Enquiry worker stub and tests; delivery channel after PRD Q4.
  - Dependabot config, Lighthouse history job, uptime monitor (operate phase).
  - Security review of the token handling and CSP on the preview deploy.

## Exit plan / reversibility
Target: **GCP Cloud Run** serving `dist/` from an nginx OCI image (a VM running the same container works as plan C).
Estimated time: **4–6 hours**, no application code change.

What stays portable now: `dist/` has no host files; `infra/headers` is host-neutral and rendered into `_headers` (Cloudflare) or
`nginx.conf` (container); `handleEnquiry` is pure TypeScript; the host, project and URLs are workflow variables; DNS is
documented, and TTL is lowered before a move.

Steps:
1. (30 min) `infra/container/Dockerfile` (`nginx:stable-alpine`, non-root, copies `dist/`) and `infra/container/nginx.conf`
   rendered from `infra/headers`. Verify with `docker build` and `curl -I` against the header tests.
2. (45 min) GCP: create a project, enable Artifact Registry and Cloud Run, create a deploy service account and a
   Workload Identity Federation pool for the GitHub repo (Terraform in `infra/gcp/`, applied by the owner). Needs a billing account
   (card), which the owner must approve; stay inside the free allowances with `max-instances=2`.
3. (60 min) Replace the Cloudflare deploy step with `docker build` of the **same `dist/` artifact**, `docker push`, and `gcloud run deploy`
   (preview: `--tag pr-N --no-traffic`; staging: a second service; production: from the tag). Auth via OIDC, no stored secret.
4. (45 min) Enquiry handler: add `infra/container/enquiry-server.ts` (Node `http` wrapper around `handleEnquiry`, run as a
   second Cloud Run service or route in the same image); update `contact.endpoint`.
5. (30 min) Deploy staging, run the E2E, header and Lighthouse suites against it; no test changes expected.
6. (60 min) Cutover: lower DNS TTL a day before, map the domain on Cloud Run (or put a load balancer/CDN in front),
   wait for the managed certificate, switch DNS, watch the uptime monitor, keep the Cloudflare project for 7 days as rollback,
   then delete the Worker and secrets.

Second exit: **Netlify or Firebase Hosting** is about 2 hours: same `dist/` and `_headers` file format (Netlify) or `firebase.json` headers.
The 100x traffic cost case for Cloud Run is solved by a CDN in front or by moving back to a static edge host.
