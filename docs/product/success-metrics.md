# Success metrics

Status: draft for Gate 1 · Owner: Product Owner · Date: 2026-10-22 · Ticket: #4

Builds on PRD section 7 (targets stay there as the source of truth if they differ; update both together). A new site has little traffic, so targets are hypotheses, reviewed 3 months after launch. No baseline exists yet: every baseline is `[[PLACEHOLDER]]` until measured. Analytics must be privacy-respecting; the analytics ID lives in the site config/env only.

## 1. Business outcomes
| ID | Metric | Target | Baseline | How measured | Cadence |
|----|--------|--------|----------|--------------|---------|
| B1 | Qualified enquiries per month | [[PLACEHOLDER: owner target (Q11); suggested start 2-4/month in first 3 months]] | [[PLACEHOLDER: 0 before launch]] | Submissions tagged qualified/unqualified by owner | Monthly |
| B2 | Visitor to contact-page rate | ≥ 2% of unique visitors (hypothesis) | [[PLACEHOLDER]] | Analytics page-view event | Monthly |
| B3 | Contact-page to submit rate | ≥ 20% (hypothesis) | [[PLACEHOLDER]] | Analytics submit-success event vs. contact-page views | Monthly |
| B4 | Time to first reply | [[PLACEHOLDER: owner commitment]] | [[PLACEHOLDER]] | Owner's log | Monthly |
| B5 | Enquiry source | Tracked, no target | [[PLACEHOLDER]] | Optional "how did you hear about us" field | Quarterly |

## 2. Engagement (leading indicators)
| ID | Metric | Target | How measured |
|----|--------|--------|--------------|
| E1 | Primary CTA click-through from Home | [[PLACEHOLDER: set after 1 month of data]] | Analytics click event |
| E2 | Service-page to contact-page progression | [[PLACEHOLDER: set after 1 month of data]] | Analytics funnel |
| E3 | Form error rate (failed or abandoned submits) | Trend downward; [[PLACEHOLDER]] | Analytics event on validation/server error |

## 3. Quality (engineering, enforced in CI)
| ID | Metric | Target | How measured |
|----|--------|--------|--------------|
| Q1 | Lighthouse Performance, Accessibility, Best Practices, SEO | ≥ 95 on Home, Services, Contact | Lighthouse in CI on preview builds |
| Q2 | LCP / INP / CLS (p75, mobile) | ≤ 2.5 s / ≤ 200 ms / ≤ 0.1 | Lab in CI; field data when traffic allows |
| Q3 | Accessibility | 0 critical/serious axe violations; keyboard-only walkthrough passes | CI axe + manual check per release |
| Q4 | Pages with unique title and description | 100% | CI check against sitemap |
| Q5 | Broken internal links | 0 | CI link check |
| Q6 | Monthly hosting and tooling spend | 0 without owner approval | Owner's billing view |

## 4. Content honesty
| ID | Metric | Target | How measured |
|----|--------|--------|--------------|
| H1 | Unsupported claims on site | 0 | PO review of every content PR |
| H2 | Remaining `[[PLACEHOLDER]]` markers in production content | 0 at Gate 3 | Repository search in release checklist |

## 5. Guardrails
- Don't trade accessibility, performance or honesty for conversion.
- Don't add a consent banner or third-party trackers just to improve measurement; use privacy-friendly tools [[PLACEHOLDER: tool decision in design phase]].
- Small numbers: with few visitors, percentages are noisy. Judge by counts and owner-tagged quality, not rates alone.

## 6. Review
- Gate 1: owner confirms or replaces targets (Q11).
- Release checklist: Q1-Q6 and H2 must pass.
- 3 months post-launch: review B and E metrics, set real targets from observed baselines, log changes in the PRD change log.

## Not in scope
Analytics implementation, dashboards, marketing attribution (later marketing team).
