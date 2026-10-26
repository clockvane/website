# Security headers and CSP

Status: proposed for Gate 2. Source of truth for values is `infra/headers` (host-neutral, to be built); this
document is the policy and rationale. It refines `docs/architecture/nfr.md` SEC-1..7 and uses ADR-002 hosts.

## Header set

| Header | Value | Why |
|---|---|---|
| `Content-Security-Policy` | see below | Blocks injected scripts, data exfiltration and framing |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Forces HTTPS. No `preload` until the real domain is final and every subdomain serves HTTPS |
| `X-Content-Type-Options` | `nosniff` | Stops MIME sniffing of uploads or mislabelled files |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Sends only the origin cross-site; full URL same-site |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()` | Disables features the site never uses |
| `Cross-Origin-Opener-Policy` | `same-origin` | Isolates the browsing context from popups |
| `Cross-Origin-Resource-Policy` | `same-origin` for the document and assets | Prevents other sites embedding our files. Not set on the Worker response if cross-origin fetch from the site needs it (see Worker) |
| `X-Robots-Tag` | `noindex, nofollow` on preview and staging only | NFR-SEO-2, added at deploy time (ADR-002) |
| `Cache-Control` | `public, max-age=31536000, immutable` for hashed `/_astro/*`; `public, max-age=0, must-revalidate` for HTML | Fast repeat visits, fresh HTML |

`X-Frame-Options` is not needed because CSP `frame-ancestors 'none'` covers modern browsers; add `X-Frame-Options: DENY`
only if a scan insists. `X-XSS-Protection` is obsolete and must not be set.

## Content-Security-Policy (launch, no analytics)

```
default-src 'self';
script-src 'self';
style-src 'self';
img-src 'self' data:;
font-src 'self';
connect-src 'self' https://<enquiry-worker-origin>;
form-action 'self' https://<enquiry-worker-origin>;
frame-ancestors 'none';
base-uri 'self';
object-src 'none';
manifest-src 'self';
upgrade-insecure-requests
```

Rationale per directive:
- `script-src 'self'`: no inline scripts, no `eval`, no third-party origins. One bundled form-enhancement script (architecture §4).
- `style-src 'self'`: no `unsafe-inline`. **Build constraint:** Astro inlines small stylesheets by default; set
  `build.inlineStylesheets: 'never'` in `astro.config` and avoid `style=""` attributes (use classes/tokens). Inline `<script>` that
  Astro may emit for tiny bundles must also be checked; the header test (below) fails the build if the built HTML contains
  inline `<script>` without `src`, `style=` attributes, or `<style>` blocks. If a hash is ever unavoidable, use a build-time
  SHA-256 hash in `script-src`, never `'unsafe-inline'`.
- `img-src 'self' data:`: `data:` only for tiny inlined placeholders; remove if unused after the build is real.
- `connect-src` / `form-action`: only our enquiry Worker origin. `<enquiry-worker-origin>` is filled from `site.config.ts → contact.endpoint` when `infra/headers` is rendered; it must never be `*`.
- `frame-ancestors 'none'`: no framing (clickjacking). Embedded scheduling widgets, if PRD Q4 picks one, need a `frame-src` entry and a security review.
- `upgrade-insecure-requests`: belt and braces with HSTS.
- Add `report-to`/`report-uri` only if a free collector is approved by the owner; not at launch.

Changes after launch: a new origin or inline script is a CSP change in the same PR, labelled `security-sensitive`, and reviewed by the
Security Reviewer. If analytics is approved (PRD Q10), add exactly one `script-src` origin and the matching `connect-src`
origin, prefer a first-party-proxied or self-hosted script, and document it in `privacy.md`.

## How each ADR-002 host applies them

### Cloudflare Pages (primary)
- CI renders `infra/headers` to a `_headers` file placed next to the artifact at deploy time (ADR-002). One rule block `/*` for
  security headers, plus `/_astro/*` for caching. Preview and staging add `X-Robots-Tag`.
- Limits to respect: `_headers` is limited in rule count and line length (check current Cloudflare Pages docs before the infra
  ticket); it applies to **static assets only**, not to Pages Functions or Worker responses.
- `*.pages.dev` is on the Public Suffix List and Cloudflare already sends HSTS for it; our `includeSubDomains` is still
  correct, and preload is not possible on that host.
- Cloudflare may add its own headers (e.g. `cf-*`, `Server: cloudflare`); not security relevant.

### Cloudflare Worker (enquiry handler)
- Worker responses do **not** get `_headers`. The wrapper in `infra/cloudflare/enquiry-worker/` sets, on every response:
  `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`,
  `Cache-Control: no-store`, and HSTS.
- CORS (site and Worker are different origins): `Access-Control-Allow-Origin` is the exact site origin from `site.config.ts`
  (never `*`, never reflected blindly), `Access-Control-Allow-Methods: POST, OPTIONS`, `Access-Control-Allow-Headers: Content-Type`,
  `Vary: Origin`, no credentials. A non-JS `<form method=post>` navigates the browser to the Worker, so the Worker answers with a
  `303` redirect back to the site's `/contact/?sent=1` (or `?error=<code>`) page; the redirect target comes from config, not from the request.
- Later option: route the Worker under the same domain (`/api/enquiry`) once the domain exists; this removes CORS and tightens the CSP
  to `'self'`. Tracked in the domain-day checklist (threat model NEW-6).

### GCP Cloud Run + nginx (exit target)
- The same `infra/headers` renders into `nginx.conf` using `add_header ... always;` at server level; remember that `add_header` in a
  nested `location` block drops inherited headers, so repeat them via one included snippet.
- TLS and HSTS: terminated by Cloud Run/load balancer; nginx still emits the HSTS header. HTTP→HTTPS redirect is the platform default.

### Netlify / Firebase (second exit)
- Netlify reads the same `_headers` format. Firebase uses the `headers` array in `firebase.json`, generated from the same source.

### GitHub Pages
- Rejected in ADR-002 largely because it cannot set these headers; a `<meta http-equiv>` CSP cannot express `frame-ancestors` and there is no HSTS control.

## Verification (for the infra and QA tickets)
1. Unit test: `infra/headers` rendering produces every header above and no `unsafe-inline`, `unsafe-eval` or `*` in the CSP.
2. Build test: scan `dist/**/*.html` for inline `<script>` bodies, `<style>` blocks and `style=` attributes; fail on any.
3. Deploy test: `curl -sI` against the preview and staging URLs and the Worker (`OPTIONS` and `POST`) asserts the table values.
4. Browser test: Playwright loads key pages and fails on any CSP violation console message; submitting the form works under the CSP.
5. Before Gate 3: run a securityheaders-style scan and record the grade in the release checklist. Target A or better.

## Open points
- The `<enquiry-worker-origin>` is unknown until the owner creates the Cloudflare account (ADR-002 owner steps).
- Whether to add Cloudflare Turnstile (`challenges.cloudflare.com` in `script-src`, `frame-src`, `connect-src`) is deferred; threat model T1.
- HSTS `preload`: decide on domain day.
