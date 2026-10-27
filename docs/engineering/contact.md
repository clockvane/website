# Contact journey and delivery boundary

Issue #61 implements static `/contact/`, `/contact/thanks/` and `/contact/error/`.
The utility pages are noindex and excluded from the sitemap. The thanks page uses
neutral copy on direct visits; the enhanced confirmation only appears after a
successful delivery response. ContactPage microdata avoids inline scripts under CSP.

The native form posts URL-encoded fields to `site.config.ts → contact.endpoint`.
Its optional enhancement uses the same endpoint with `Accept: application/json`.
Name (100 characters), email or international phone (254), and message (10–3000)
share one Zod Mini schema between client and server. This uses the existing Zod
dependency and keeps the client bundle within the 15 kB compressed budget.
Optional company collection was omitted to minimise personal data.

`src/lib/contact/handler.ts` accepts standard Request/Response objects and injected
rate-limit and delivery functions. It checks the site Origin (or Referer when
Origin is absent), supported media types, a streamed 10,240-byte maximum, field
constraints, control characters/markup, honeypot and optional form-start timestamp.
Only validated fields and a generated request ID reach the delivery function.
Values never become headers, redirect targets or URL parameters. The future
delivery adapter must send plain text and include the request ID.

Enhanced submissions get field errors (400), oversize (413), unsupported media
(415), rate-limit (429) or generic delivery failure (502). Native POSTs redirect
with 303 to fixed success/failure URLs built from the configured site origin.
The client keeps text on failure, focuses a linked error summary or failure panel,
and restores controls for retry. While sending, fields are read-only and a guarded,
aria-disabled submit button preserves focus. Success clears the form. There is no
application storage, logging, cookie or local-storage use.

The two-second time check is an additional signal for enhanced submissions. A
static no-JS document cannot provide a trustworthy render-time clock, so an absent
timestamp is allowed; Origin, honeypot, schema and edge limiter still apply. A
client timestamp is forgeable and is never treated as authentication.

The thin Worker wrapper lives in `infra/cloudflare/enquiry-worker/`. Its response
headers come from `infra/headers/render.ts`, including errors, preflight and health.
CORS permits only the configured site origin, without credentials. The
`ENQUIRY_RATE_LIMIT` binding checks the edge-supplied IP, configured for five
requests per 60 seconds; missing binding/IP fails closed. These are approximate
per-location limits, not a global daily quota, as explained in the
[Cloudflare rate-limit documentation](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/).
An office sharing an IP shares this allowance. Worker observability is disabled;
the app does not log IPs or user agents. Preview origins cannot deliver through
the production allow-list.

## Activation before release

ADR-002 explicitly requires an error-only delivery stub until PRD Q4 is answered.
The Worker therefore returns a failure after valid submissions; it never reports
that an undelivered message was sent. The public endpoint currently uses the
reserved non-live origin in site config. Browser tests intercept that endpoint and
exercise the real portable handler with deterministic delivery dependencies.

The owner must choose the notification channel/provider and supply its destination
through Worker secrets (never issues, source, browser config or `.env` files).
No delivery secret is needed by the current stub. Exact secret names and provider
permissions belong to the provider adapter once Q4 is answered. The activation PR
must implement plain-text delivery, a provider-appropriate daily circuit breaker,
timeout handling and provider privacy/retention disclosures before enabling it.

Deploy the Worker with its rate-limit binding and an unused namespace ID (the
example `1001` must not collide with another application). Set the real site domain
and public Worker endpoint in site config. Render the site's CSP with that exact
Worker origin using the existing header renderer. Configure a public fallback
email or phone in site config when supplied; placeholders are omitted everywhere.
Keep logs free of enquiry bodies. Verify CORS, headers, rate limits and both native
303 paths on the deployed origin before Gate 3. No account, secret or deployment
was created by this implementation.
