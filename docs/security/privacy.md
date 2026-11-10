# Privacy: data, retention and consent

Status: proposed for Gate 2. This is an engineering position, **not legal advice**. The public privacy notice (PRD CR-6, legal pages)
must be written from this document once the open questions are answered and, ideally, reviewed by someone qualified. Principles from
NFR-SEC-2 / SEC-11: collect the minimum, say what and why, no cross-site tracking, banner only if required.

## What we collect

| Data | Source | Purpose | Required? | Stored where |
|---|---|---|---|---|
| Name | Enquiry form | Address the reply | Yes | Delivery channel only |
| Reply contact (email or phone) | Enquiry form | Reply to the enquiry | Yes | Delivery channel only |
| Message (what they want automated or built) | Enquiry form | Understand and quote the work | Yes | Delivery channel only |
| Honeypot and form-render time | Browser | Spam control | Technical | Not stored; evaluated in the request and discarded |
| IP address and user agent | Network | Rate limiting, abuse prevention, delivery | Technical | Processed transiently by Cloudflare (edge logs and rate limiting); **not** written to our logs or delivery message |
| Page views, load performance, path, referrer, country, device type, browser, OS (aggregate) | Cloudflare Web Analytics beacon (PRD Q10 approved) | Measure the funnel (success-metrics) | No: not loaded with Global Privacy Control | Cloudflare, aggregate; no cookies or local storage, query strings not logged |

We set **no cookies** and use no local storage at launch (SEC-11). We do not collect special-category data on purpose; the form text
says not to include sensitive or confidential information. No payment, account or login data exists (PRD A4).

## Where it goes
1. Browser → Cloudflare Worker (HTTPS) → HubSpot form submission API (PRD Q4, owner decision 2026-11-09). The HubSpot portal and form IDs are Worker secrets. HubSpot creates a CRM contact (reply contact: an email, or a phone number inside the message; first name; message with the chosen service) and notifies the owner. The browser never contacts HubSpot.
2. Cloudflare (hosting, edge, Worker) is a processor for traffic data. HubSpot, Inc. (free CRM; data stored in its US data centre (the account's portal is on HubSpot's na2 region)) is a second
   processor and must be listed in the notice.
3. Bookings (#177): "Book a call" opens the owner's HubSpot Meetings page (`booking` in `site.config.ts`) as a plain link in a
   new tab with `rel="noopener noreferrer"`. HubSpot is a processor for what visitors enter on that page (name, email, chosen
   time). Nothing from HubSpot is embedded or loaded by this site, so the CSP is unchanged and no HubSpot cookie is set here.
4. No sale or sharing for advertising. HubSpot is used only as the enquiry inbox/CRM and for bookings: no HubSpot tracking script,
   newsletter or ad pixel on the site.
5. Transfers: Cloudflare and HubSpot process outside India/EU. The notice must say so and name the safeguard
   (standard contractual clauses / provider DPAs). [[PLACEHOLDER: owner confirms HubSpot DPA and SCCs are accepted in the portal]]

## Retention
Proposed (owner to confirm):
- Enquiries: keep while the conversation is active, then delete **12 months after the last contact** if no engagement began. If a
  client engagement starts, the data moves into the contract records under their own retention rules.
- Worker and server logs: metadata only (request id, status, reason code), no contact values, retained per platform defaults and no
  longer than 30 days where configurable.
- Analytics: Cloudflare Web Analytics keeps unsampled beacon data for 7 days, then a roughly 10% aggregate sample; the dashboard
  shows the last six months (Cloudflare Web Analytics FAQ). Within the 14-month limit.
- Deletion/correction requests: answered within 30 days (GDPR: one month; DPDP: as per rules once in force). The owner needs a
  documented routine: search the delivery channel by the sender's contact and delete.

## Legal bases and rights (basics)
- **GDPR** (applies if we target or monitor people in the EU/UK, likely for some inquiries): basis for enquiries is legitimate
  interest / steps before a contract (Art. 6(1)(b),(f)); rights to access, rectify, erase, object, restrict, port; right to
  complain to a supervisory authority. Cookieless aggregate analytics usually needs no consent banner under ePrivacy, but this depends on the tool and national guidance.
- **India DPDP Act 2023** (applies to digital personal data processed in India): consent must be free, specific, informed, with a clear
  notice at or before collection; withdrawal as easy as giving it; data fiduciary must keep data accurate, secure and erase it when
  the purpose ends; grievance contact required; the Rules phase in over time, so confirm current commencement dates when writing the notice. Form design: a short notice
  next to the submit button ("We use these details only to reply to your enquiry. Privacy notice →") and the act of submitting is the affirmative action. No pre-ticked boxes.
- Children: the site is business-to-business; the notice says it is not directed at children.

## Consent, cookies and analytics stance
- **Launch: Cloudflare Web Analytics (PRD Q10, approved), no cookies, no banner.** A banner is not shown because nothing needs
  consent: Cloudflare states the beacon uses no client-side state (cookies, localStorage) and does not fingerprint visitors by IP
  address or User-Agent ([product page](https://www.cloudflare.com/web-analytics/)), and query strings are not logged
  ([FAQ](https://developers.cloudflare.com/web-analytics/faq/)). No custom events and no cross-site tracking.
- **How it loads** (`src/lib/analytics/beacon.ts`, `src/scripts/analytics.ts`): the public token lives only in `site.config.ts`
  (validated: 32 lowercase hex or a placeholder, which disables analytics). A 0.6 kB first-party loader adds the one deferred
  manual-snippet script `https://static.cloudflareinsights.com/beacon.min.js` only when the page is served from the production
  origin (so previews, staging, CI and local runs are never counted) and Global Privacy Control is not set. The CSP allows that
  script URL and `https://cloudflareinsights.com` (beacon endpoint) only for artifacts that load analytics (`headers.md`).
  Automatic injection on the Cloudflare Pages project must stay off, or the GPC control is bypassed.
- **Criteria the tool was chosen against (PRD Q10):** choose a cookieless tool with no cross-site tracking and no fingerprinting, IP not stored
  or truncated, data not used for the provider's own purposes, free tier, and ID in `site.config.ts`. Load only one deferred script, and
  update the CSP and this document in the same PR. If the tool uses cookies or identifiers for individuals, a consent banner with equal-prominence
  Accept/Reject and no tracking before consent is required instead; the PRD target "conversion" can then only be measured on consenting users.
- **No third-party embeds** (maps, video, chat widgets, social buttons) at launch; each would add cookies, requests to third parties and CSP changes.
- Global Privacy Control: honoured; with `navigator.globalPrivacyControl === true` the beacon script is never requested and no
  beacon is sent (`tests/e2e/analytics.spec.ts`). Do-Not-Track is deprecated and not used as a signal.

## Controls that enforce this (cross-reference)
- No PII in logs, generic errors, secret destination: threat model T4, T8.
- Minimal fields and field length limits: `handleEnquiry` schema (SEC-8).
- Referrer-Policy and no third-party requests: `headers.md`.
- Form never uses GET, so PII never lands in URLs, referrers or access logs.

## Open questions for the owner
1. **PRD Q4:** which channel receives enquiries (and which provider will therefore hold the data)? Also the promised response time shown to visitors.
2. **PRD Q9:** legal entity name and registered address for the notice (data fiduciary / controller identity). `[[PLACEHOLDER: legal entity]]`
3. **PRD Q8:** grievance/privacy contact email or form. `[[PLACEHOLDER: privacy contact]]` The domain email is not live; a temporary contact path is needed because DPDP requires a grievance contact.
4. ~~**PRD Q10:** is cookieless analytics acceptable, and which tool?~~ Answered: Cloudflare Web Analytics (#164, enabled in #169).
5. **PRD Q3:** target regions. If EU/UK visitors are targeted, GDPR applies fully (including a possible EU representative for larger scale; unlikely at this size).
6. Do you accept the retention proposal (12 months after last contact)?
7. Who answers deletion requests, and how quickly can they act?
8. Can a qualified person review the final notice before Gate 3?

## Out of scope
Writing the public privacy page (content/copy ticket), choosing the analytics tool, legal sign-off.
