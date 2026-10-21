# Test strategy

## Scope and risks
What can break that would hurt the business (broken contact path, slow pages, inaccessible
navigation, bad SEO metadata, broken links) — ranked.

## Test pyramid
| Level | Tool | What it covers | Where it runs |
|-------|------|----------------|---------------|
| Static | lint, type-check, format | | local + CI |
| Unit | | logic, utilities, config mapping | local + CI |
| Component | | components and states | local + CI |
| E2E | | key journeys per page | CI (+ local, one browser) |
| Accessibility | | axe rules, keyboard, focus | CI |
| Performance/SEO | Lighthouse CI | budgets from NFRs | CI on preview/staging |
| Links | | internal + external links | CI nightly |

## Viewports and browsers
360 / 768 / 1280. Chromium locally; more engines in CI if free minutes allow.

## Acceptance criteria → tests
Every story's Given/When/Then maps to a named test or a recorded manual check.

## Flaky tests
Quarantine with a ticket within 24 h; never retry-until-green silently.

## Exit criteria for release
All suites green on staging; Lighthouse budgets met; no open BLOCKER/MAJOR bugs.
