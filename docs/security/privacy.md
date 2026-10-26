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
| Page views (aggregate) | Optional analytics | Measure the funnel (success-metrics) | No, only if PRD Q10 approved | Analytics provider, aggregate |

We set **no cookies** and use no local storage at launch (SEC-11). We do not collect special-category data on purpose; the form text
says not to include sensitive or confidential information. No payment, account or login data exists (PRD A4).

## Where it goes
1. Browser → Cloudflare Worker (HTTPS) → delivery channel chosen by the owner (PRD Q4, **not yet decided**) held in a Worker secret.
2. Cloudflare (hosting, edge, Worker) is a processor for traffic data. The delivery channel provider (to be named) is a second
   processor and must be listed in the notice.
3. No sale or sharing for advertising. No CRM, newsletter or ad pixel in v1 (PRD out of scope).
4. Transfers: Cloudflare and likely channel providers process outside India/EU. The notice must say so and name the safeguard
   (standard contractual clauses / provider DPAs). Check each provider's DPA when chosen.

## Retention
Proposed (owner to confirm):
- Enquiries: keep while the conversation is active, then delete **12 months after the last contact** if no engagement began. If a
  client engagement starts, the data moves into the contract records under their own retention rules.
- Worker and server logs: metadata only (request id, status, reason code), no contact values, retained per platform defaults and no
  longer than 30 days where configurable.
- Analytics (if any): aggregate and cookieless; provider retention at most 14 months.
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
- **Launch default: no analytics, no cookies, no banner.** A banner is not shown because nothing needs consent.
- **If analytics is approved (PRD Q10):** choose a cookieless tool with no cross-site tracking and no fingerprinting, IP not stored
  or truncated, data not used for the provider's own purposes, free tier, and ID in `site.config.ts`. Load only one deferred script, and
  update the CSP and this document in the same PR. If the tool uses cookies or identifiers for individuals, a consent banner with equal-prominence
  Accept/Reject and no tracking before consent is required instead; the PRD target "conversion" can then only be measured on consenting users.
- **No third-party embeds** (maps, video, chat widgets, social buttons) at launch; each would add cookies, requests to third parties and CSP changes.
- Do-Not-Track / Global Privacy Control: honour GPC by not loading analytics if ever added.

## Controls that enforce this (cross-reference)
- No PII in logs, generic errors, secret destination: threat model T4, T8.
- Minimal fields and field length limits: `handleEnquiry` schema (SEC-8).
- Referrer-Policy and no third-party requests: `headers.md`.
- Form never uses GET, so PII never lands in URLs, referrers or access logs.

## Open questions for the owner
1. **PRD Q4:** which channel receives enquiries (and which provider will therefore hold the data)? Also the promised response time shown to visitors.
2. **PRD Q9:** legal entity name and registered address for the notice (data fiduciary / controller identity). `[[PLACEHOLDER: legal entity]]`
3. **PRD Q8:** grievance/privacy contact email or form. `[[PLACEHOLDER: privacy contact]]` The domain email is not live; a temporary contact path is needed because DPDP requires a grievance contact.
4. **PRD Q10:** is cookieless analytics acceptable, and which tool?
5. **PRD Q3:** target regions. If EU/UK visitors are targeted, GDPR applies fully (including a possible EU representative for larger scale; unlikely at this size).
6. Do you accept the retention proposal (12 months after last contact)?
7. Who answers deletion requests, and how quickly can they act?
8. Can a qualified person review the final notice before Gate 3?

## Out of scope
Writing the public privacy page (content/copy ticket), choosing the analytics tool, legal sign-off.
