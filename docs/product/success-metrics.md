# Success metrics

Status: v3 · Owner: Product Owner · Date: 2026-11-04 · Ticket: #122

Builds on PRD section 7 (update both together; if they differ, the PRD wins). No baseline exists yet. The only business targets here are the ones the owner set (Q4, Q11). Every other business target stays `[[PLACEHOLDER]]` until there is data, so no number here is invented.

**How we measure:** Cloudflare Web Analytics (Q10) reports page views and has no custom events, so conversions are counted from the enquiry log (the Google Sheet backup, Q4) and from bookings, not from click tracking. Each enquiry records its service (PRD FR-9).

## 1. Business outcomes
| ID | Metric | Target | Baseline | How measured | Cadence |
|----|--------|--------|----------|--------------|---------|
| B1 | Qualified enquiries, all services | 3–5 per month in the first quarter, growing after (owner, Q11) | 0 before launch | Enquiry log, tagged qualified or not by the owner | Monthly |
| B2 | First reply to an enquiry | Within 1 business day (owner, Q4) | [[PLACEHOLDER: measure from launch]] | Enquiry log | Monthly |
| B3 | Enquiry source | Tracked, no target | [[PLACEHOLDER: measure from launch]] | Optional "how did you hear about us" answer | Quarterly |

## 2. Conversions per service
Enquiries and bookings count together, by the service recorded on them. Qualified counts are the owner's tags.

| ID | Service | Conversion | Target | Baseline | How measured |
|----|---------|------------|--------|----------|--------------|
| C1 | Expert support | "Book an expert": enquiry or booking | [[PLACEHOLDER: set from 3 months of data]] | 0 before launch | Enquiry log and bookings |
| C2 | AI automation | "Book a call": enquiry or booking | [[PLACEHOLDER: set from 3 months of data]] | 0 before launch | Enquiry log and bookings |
| C3 | Website creation | "Book a call": enquiry or booking | [[PLACEHOLDER: set from 3 months of data]] | 0 before launch | Enquiry log and bookings |
| C4 | Solutions for companies | "Book a call": enquiry or booking | [[PLACEHOLDER: set from 3 months of data]] | 0 before launch | Enquiry log and bookings |
| C5 | Not sure | Enquiry with no service chosen. Many of these would mean the services aren't clear | Tracked, no target | 0 before launch | Enquiry log |

## 3. Engagement (leading indicators)
| ID | Metric | Target | How measured |
|----|--------|--------|--------------|
| E1 | Page views per service page | [[PLACEHOLDER: set from 3 months of data]] | Cloudflare Web Analytics |
| E2 | Enquiries per service against that service page's views | [[PLACEHOLDER: set from 3 months of data]] | C1-C4 against E1 |
| E3 | Failed enquiries | Trend downward; [[PLACEHOLDER: set from 3 months of data]] | Contact handler failures and `/contact/error/` views |

## 4. Quality (engineering, enforced in CI)
| ID | Metric | Target | How measured |
|----|--------|--------|--------------|
| Q1 | Lighthouse Performance, Accessibility, Best Practices, SEO | ≥ 95 on mobile, every page (change request 3) | Lighthouse in CI on preview builds |
| Q2 | LCP / CLS, lab | ≤ 2.0 s / ≤ 0.05 (change request 3) | Lighthouse in CI |
| Q3 | LCP / INP / CLS, field (p75, mobile) | ≤ 2.5 s / ≤ 200 ms / ≤ 0.1 | Field data when traffic allows |
| Q4 | Script per page / page weight | ≤ 50 kB compressed / ≤ 1.5 MB (change request 3) | CI size check |
| Q5 | Accessibility | 0 critical or serious axe violations; keyboard-only walkthrough passes | CI axe + manual check per release |
| Q6 | Pages with unique title and description | 100% | CI check against sitemap |
| Q7 | Broken internal links | 0 | CI link check |
| Q8 | Monthly hosting and tooling spend | 0 without owner approval | Owner's billing view |

## 5. Content honesty
| ID | Metric | Target | How measured |
|----|--------|--------|--------------|
| H1 | Unsupported claims on site | 0 | PO review of every content PR |
| H2 | Remaining `[[PLACEHOLDER]]` markers in production content | 0 at Gate 3 | Repository search in release checklist |
| H3 | Example screens or demos without an "example" label | 0 | PO and design review of every page PR |
| H4 | Copy that describes clients by size or stage, or plays on the name | 0 | PO review of every content PR |

## 6. Guardrails
- Don't trade accessibility, performance or honesty for conversion.
- Don't add a consent banner or third-party trackers to improve measurement.
- Small numbers: with few visitors, percentages are noisy. Judge by counts and owner-tagged quality, not rates alone.

## 7. Review
- Release checklist: Q1-Q8 and H1-H4 must pass.
- 3 months after launch: review sections 1-3, set per-service targets from observed baselines, log the changes in the PRD change log.

## Not in scope
Analytics implementation, dashboards, marketing attribution (later marketing team).
